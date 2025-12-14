import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtServiceWrapper } from '../jwt/jwt.service';
import { SessionsService } from '../session/session.service';
import { ClientsService } from '../clients/clients.service';
import * as bcrypt from 'bcryptjs';
import { AppLoggerService } from '../logging/logging.service';
import { randomBytes } from 'crypto';
import { User, Role, Type } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';
import { htmlEmail } from 'src/Emails/otp';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtServiceWrapper: JwtServiceWrapper,
    private readonly sessionsService: SessionsService,
    private readonly clientsService: ClientsService,
    private readonly logger: AppLoggerService,
    private readonly mailService:MailService
  ) {}

  private generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

  /**
   * Validate username/password and return user record.
   */
  async signIn(email: string, password: string) {
    if (!email || !password) throw new UnauthorizedException('Invalid credentials');

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`signIn: user not found for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.password) {
      this.logger.warn(`signIn: user ${email} has no password set`);
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      this.logger.warn(`signIn: invalid password for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      this.logger.warn(`signIn: user ${email} is inactive`);
      throw new ForbiddenException('User disabled');
    }
    return user;
  }

  /**
   * Issue access + refresh tokens and create a session record (hash refresh token).
   */
  async issueTokensForUser(user: any, clientId?: string, meta?: { ip?: string; userAgent?: string }) {
    // Build access token payload
    const accessPayload = {
      sub: user.id,
      email: user.email,
      name: user.name ?? undefined,
      type: user.type ?? undefined,
      globalRole: user.role ?? [],
      clientId: clientId ?? '',
      clientRoles: [], // populate if you implement per-client roles
    };

    const accessToken = this.jwtServiceWrapper.signAccessToken(accessPayload);

    // Refresh token (opaque JWT or random string). We'll sign a JWT refresh token too.
    const refreshToken = this.jwtServiceWrapper.signRefreshToken({ sub: user.id });

    const expiresMs = parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '30d');
    const expiresAt = new Date(Date.now() + expiresMs);


    await this.sessionsService.createSession({
      userId: user.id,
      refreshToken,
      userAgent: meta?.userAgent ?? null,
      ip: meta?.ip ?? null,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token and return payload (throws if invalid).
   */
  verifyAccessToken(token: string) {
    return this.jwtServiceWrapper.verifyAccessToken(token);
  }

  /**
   * Rotate refresh token: verify provided refresh token, find matching session,
   * create a new refresh token, store its hash, and return new tokens.
   */
  async refreshTokens(currentRefreshToken: string) {
    if (!currentRefreshToken) throw new UnauthorizedException('No refresh token provided');
    let payload: any;
    try {
      payload = this.jwtServiceWrapper.verifyRefreshToken(currentRefreshToken);
    } catch (e) {
      this.logger.warn('refreshTokens: verify failed', e as any);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const userId = payload?.sub;
    if (!userId) {
      this.logger.warn('refreshTokens: token missing subject');
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    // Find non-expired sessions for this user
    const sessions = await this.sessionsService.findValidSessionsForUser(userId);
    let matchedSession: any = null;
    for (const s of sessions) {
      const ok = await bcrypt.compare(currentRefreshToken, s.refreshTokenHash);
      if (ok) {
        matchedSession = s;
        break;
      }
    }
    if (!matchedSession) {
      this.logger.warn(`refreshTokens: no matching session for userId=${userId}`);
      throw new UnauthorizedException('No matching session');
    }

    // Rotate refresh token
    const newRefreshToken = this.jwtServiceWrapper.signRefreshToken({ sub: userId });
    const newRefreshHash = await bcrypt.hash(newRefreshToken, 10);
    const newExpiresAt = new Date(Date.now() + parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '30d'));

    await this.prisma.session.update({
      where: { id: matchedSession.id },
      data: {
        refreshTokenHash: newRefreshHash,
        expiresAt: newExpiresAt,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const accessToken = this.jwtServiceWrapper.signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name ?? undefined,
      type: user.type ?? undefined,
      globalRole: user.role ?? [],
      clientId: '',
      clientRoles: [],
    });

    return { accessToken, refreshToken: newRefreshToken, user };
  }

  /**
   * Revoke session by refresh token (delete session matching hashed token).
   */
  async revokeByRefreshToken(refreshToken: string) {
    if (!refreshToken) return;
    try {
      const payload = this.jwtServiceWrapper.verifyRefreshToken(refreshToken);
      const userId = payload?.sub;
      if (!userId) return;

      const sessions = await this.prisma.session.findMany({ where: { userId } });
      for (const s of sessions) {
        const ok = await bcrypt.compare(refreshToken, s.refreshTokenHash);
        if (ok) {
          await this.prisma.session.delete({ where: { id: s.id } });
          this.logger.log(`Session revoked (id=${s.id}, user=${userId})`);
          return;
        }
      }
    } catch (e) {
      // ignore invalid token
      this.logger.warn('revokeByRefreshToken: invalid token', e as any);
    }
  }
  
  // ... inside AuthService class

  async createUser(data: any) {
    // 1. Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // 3. Create User
    const newUser = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        // Set defaults if needed, e.g. isActive: true
      },
    });

    return newUser;
  }

  //Request Signup OTP
  async requestSignupOtp(email: string, clientId: string) {
    const client = await this.clientsService.findByClientId(clientId);

    if (!client) {
      throw new BadRequestException('Invalid clientId');
    }

    if (client.authMode === 'IITD_ONLY') {
      throw new ForbiddenException(
        'This client does not allow Password signup',
      );
    }

  //  Generate OTP
  const otp = this.generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  // Store OTP with expiry
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await this.prisma.signUpOTPs.upsert({
    where:{
      email:email
    },
    update:{
      otp:otpHash
    },
    create: {
      email,
      otp:otpHash,
      expiresAt,
    },
  });

  let subject  = "Email Verification – BSW IIT Delhi";
  //Send through Email
  await this.mailService.sendMail(email,subject,htmlEmail(otp))
  return {
    success: true,
    message: 'OTP sent to email',
  };
}


async verifySignupOtp(email: string, otp: string, clientId: string) {
  //verify client
  const client = await this.clientsService.findByClientId(clientId);
  if(!client){
    throw new NotFoundException("Client not found");
  }

  const record = await this.prisma.signUpOTPs.findUnique({
    where:{
      email
    }
  });

  if (!record) {
    throw new BadRequestException('Invalid OTP');
  }

  // Check expiry
  if (record.expiresAt < new Date()) {
    throw new BadRequestException('OTP expired');
  }

  // Validate OTP
  const res = await bcrypt.compare(otp,record.otp);
  if(!res){
    throw new BadRequestException("Invalid OTP");
  } 


  //Create a user
  const newUser = await this.prisma.user.create({
    data:{
      email:email,
    }
  });

  console.log("Created User");
  //provide onboarding token to set password and other details 
  const onboarding_token = this.jwtServiceWrapper.signOnboardingToken({
    sub:email
  });


  return {newUser,onboarding_token};
}
}






/* helper */
function parseDuration(input: string) {
  const m = input.match(/^(\d+)(s|m|h|d)$/i);
  if (!m) return 30 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  switch (u) {
    case 's': return n * 1000;
    case 'm': return n * 60 * 1000;
    case 'h': return n * 60 * 60 * 1000;
    case 'd': return n * 24 * 60 * 60 * 1000;
    default: return n * 1000;
  }
}
