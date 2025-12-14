import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';
import { PrismaService } from '../prisma/prisma.service';
import { JwtServiceWrapper } from '../jwt/jwt.service';

@Injectable()
export class IitdService {
  private readonly iitdClientId = process.env.IITD_AUTH_CLIENT_ID!;
  private readonly iitdClientSecret = process.env.IITD_AUTH_CLIENT_SECRET!;
  private readonly iitdRedirectUri = process.env.IITD_AUTH_REDIRECT_URI!;
  private readonly authorizeUrl = process.env.IITD_AUTH_URL!;
  private readonly tokenUrl = process.env.IITD_TOKEN_URL!;
  private readonly resourceUrl = process.env.IITD_USERINFO!;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtServiceWrapper,
  ) {}

  getAuthorizationUrl(encodedState: string): string {
    const url = new URL(this.authorizeUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.iitdClientId);
    url.searchParams.set('redirect_uri', this.iitdRedirectUri);
    url.searchParams.set('state', encodedState);
    return url.toString();
  }

  async handleOAuthCallback(code: string, rawState: string) {
    let decodedState;
    try {
      decodedState = JSON.parse(Buffer.from(rawState, 'base64url').toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid state');
    }

    const { clientId, redirectUri } = decodedState;

    let tokenResp;
    try {
      tokenResp = await axios.post(
        this.tokenUrl,
        new URLSearchParams({
          client_id: this.iitdClientId,
          client_secret: this.iitdClientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.iitdRedirectUri,
        }),
        {
          timeout: 7000,
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        },
      );
    } catch (e) {
      throw new InternalServerErrorException('Failed to exchange token');
    }

    const accessTokenIITD = tokenResp.data?.access_token;
    if (!accessTokenIITD) {
      throw new UnauthorizedException('Invalid token response from IITD');
    }

    let userResp;
    try {
      userResp = await axios.post(
        this.resourceUrl,
        new URLSearchParams({ access_token: accessTokenIITD }),
        {
          timeout: 7000,
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        },
      );
    } catch (e) {
      throw new InternalServerErrorException('Failed to fetch user profile');
    }

    const { user_id, mail, name, uniqueiitdid, category, department } = userResp.data ?? {};
    if (!user_id) {
      throw new UnauthorizedException('Invalid user profile data');
    }

    const user = await this.prisma.user.upsert({
      where: { email: `${user_id}@iitd.ac.in` },
      update: {
        email: mail,
        name,
        category,
        department,
        iitduuid: uniqueiitdid,
      },
      create: {
        kerbrosId: user_id,
        email: mail,
        name,
        category,
        department,
        iitduuid: uniqueiitdid,
      },
    });

    const accessToken = this.jwtService.signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name ?? '',
      type: user.type,
      globalRole: user.role,
      clientId: clientId,
      clientRoles: [], 
    });

    const refreshToken = this.jwtService.signRefreshToken({ sub: user.id });

    return {
      user,
      accessToken,
      refreshToken,
      redirectUri,
    };
  }
}