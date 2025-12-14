import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Headers,
  UseGuards,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthorizeQueryDto } from './dto/authorize.dto';
import { ClientsService } from '../clients/clients.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import type { RequestUser } from 'src/common/interfaces/request-user.interface';
import { JwtAuthGuard } from 'src/common/gaurds/jwt-auth.guard';
import { emailDTO, verifyDTO } from './dto/email.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly clientsService: ClientsService,
  ) {}

  /**
   * NOTE:
   * This endpoint previously handled OAuth-style redirects.
   * For the central auth-server approach we now return client metadata
   * (authMode, client id/name) so the frontend can render a client-specific login page.
   *
   * GET /auth/authorize?client_id=...&redirect_uri=...&state=...
  */

  @Get('authorize')
  async authorize(
    @Query() query: AuthorizeQueryDto, 
    @Res() res: Response
  ) {
    const { client_id, redirect_uri, state } = query;
    
    // 1. Validate Inputs
    if (!client_id) throw new BadRequestException('client_id required');
    if (!redirect_uri) throw new BadRequestException('RedirectUri is required');

    let client: any;
    try {
      client = await this.clientsService.findByClientId(client_id);
      
      // 2. Validate Redirect URI
      // Ensure we check against the allowed list safely
      console.log(client);
      const allowedUris = Array.isArray(client.redirectUris) 
        ? client.redirectUris 
        : [client.redirectUris];
      console.log(allowedUris);
      if (!allowedUris.includes(redirect_uri.toString().trim())) {
        throw new BadRequestException("Redirect URI not allowed");
      }
    } catch (err) {
      // Re-throw if it's already a BadRequest, otherwise generic invalid client
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Invalid client_id');
    } 

    // 3. Build Query Params
    const params = new URLSearchParams({
      client_id: client.clientId,
      AUTHMODE: client.authMode,
      redirect_uri: redirect_uri, 
      state: state || ''
    });

    // 4. Construct URL
    const url = `${process.env.FRONTEND_URL}/login?${params.toString()}`;

    // 5. Execute Redirect
    return res.redirect(url);
  }

  /**
   * POST /auth/login
   * Body: { email, password, client_id? }
   * Returns JSON with access_token, refresh_token and user info.
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res() res: Response) {
    const body = dto as any; 
    const { email, password } = body;
    
    const clientId = body.client_id || body.clientId;
    const redirectUri = body.redirect_uri || body.redirectUri;
    const state = body.state || '';

    let client: any = null;
    if (clientId) {
      try {
        client = await this.clientsService.findByClientId(clientId);
        
        if (redirectUri) {
          const allowedUris = Array.isArray(client.redirectUris) 
            ? client.redirectUris 
            : [client.redirectUris];
            
          const isAllowed = allowedUris.some((uri: string) => 
            uri.trim() === redirectUri.toString().trim()
          );

          if (!isAllowed) {
             throw new BadRequestException("Redirect URI not allowed for this client");
          }
        }
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException('Invalid client_id');
      }

      if (client.authMode === 'IITD_ONLY') {
        throw new BadRequestException('Client requires IITD login only');
      }
    }

    const user = await this.authService.signIn(email, password);

    const { accessToken, refreshToken } = await this.authService.issueTokensForUser(
      user,
      client?.clientId, 
      {
        ip: req.ip,
        userAgent: req.get('user-agent') || 'unknown',
      },
    );

    const isProd = process.env.NODE_ENV === 'production';
    const sameSiteMode = isProd ? 'none' : 'lax';

    try {
      res.cookie(process.env.COOKIE_REFRESH_NAME || 'refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: sameSiteMode,
        domain:process.env.COOKIE_DOMAIN || 'localhost',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        domain:process.env.COOKIE_DOMAIN || 'localhost',
        path: '/',
        sameSite: sameSiteMode,
        maxAge: 15 * 60 * 1000,
      });
    } catch (e) {
      // ignore cookie failures
    }

    if (redirectUri && client) {
      const params = new URLSearchParams({
        access_token: accessToken,
        refresh_token: refreshToken,
        state: state,
      });

      return res.json({
        success: true,
        redirectUrl: `${redirectUri}?${params.toString()}`,
      });
    }

    return res.json({
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        roles: user.role 
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  async securedRoute(@CurrentUser() user:RequestUser){
    return user;
  } 

  @Post('/dummy/insert')
  async createUser(@Body() userData: any) { // Use @Body() instead of @Req()
    if(process.env.NODE_ENV != 'development'){
      return new ForbiddenException("Not Allowed in PROD");
    }
    // validation (optional but recommended)
    if (!userData.email || !userData.password) {
      throw new BadRequestException('Email and Password are required');
    }

    const newUser = await this.authService.createUser(userData);
    
    // Don't return the password field in the response
    const { password, ...result } = newUser;
    return result;
  }

  /**
   * POST /auth/refresh
   * Rotates refresh token and returns new access + refresh tokens.
   * Accepts refresh token either from cookie or from JSON body { refresh_token }.
   */
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response, @Body() body: any) {
    const cookieName = process.env.COOKIE_REFRESH_NAME || 'refresh_token';
    const refreshTokenFromCookie = (req.cookies || {})[cookieName] as string | undefined;
    const refreshTokenFromBody = body?.refresh_token as string | undefined;
    const refreshToken = refreshTokenFromBody ?? refreshTokenFromCookie;

    if (!refreshToken) return res.status(401).json({ error: 'No refresh token provided' });

    try {
      const { accessToken, refreshToken: newRefresh, user } = await this.authService.refreshTokens(refreshToken);

      const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
      const cookieSecure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
      const sameSite = (process.env.COOKIE_SAME_SITE as 'lax' | 'none' | 'strict') || 'lax';

      try {
        res.cookie(process.env.COOKIE_REFRESH_NAME || cookieName, newRefresh, {
          httpOnly: true,
          secure: cookieSecure,
          sameSite,
          domain: cookieDomain,
          maxAge: parseInt(String(parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '30d'))),
        });
      } catch {
        // ignore cookie errors
      }

      return res.json({ access_token: accessToken, refresh_token: newRefresh, user: { id: user.id, email: user.email } });
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  }

  /**
   * POST /auth/logout
   * Revokes session corresponding to provided refresh token (cookie or body).
   */
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response, @Body() body: any) {
    const cookieName = process.env.COOKIE_REFRESH_NAME || 'refresh_token';
    const refreshTokenFromCookie = (req.cookies || {})[cookieName] as string | undefined;
    const refreshTokenFromBody = body?.refresh_token as string | undefined;
    const refreshToken = refreshTokenFromBody ?? refreshTokenFromCookie;

    if (refreshToken) {
      await this.authService.revokeByRefreshToken(refreshToken);
    }

    try {
      res.clearCookie(process.env.COOKIE_REFRESH_NAME || cookieName);
    } catch {
      // ignore
    }

    return res.json({ success: true });
  }

  /**
   * POST /auth/introspect
   * Body: { token: "<access_token>" }
   * Headers: x-client-id, x-client-secret  (simple client auth)
   *
   * Returns canonical user claims if token valid and client credentials ok.
   */
  @Post('introspect')
  @HttpCode(HttpStatus.OK)
  async introspect(@Headers() headers: any, @Body() body: { token: string }) {
    const token = body?.token;
    if (!token) return { active: false };

    const clientId = headers['x-client-id'] as string | undefined;
    const clientSecret = headers['x-client-secret'] as string | undefined;
    if (!clientId || !clientSecret) {
      throw new UnauthorizedException('Client credentials required in headers');
    }

    const ok = await this.clientsService.validateClient(clientId, clientSecret);
    if (!ok) throw new UnauthorizedException('Invalid client credentials');

    try {
      const payload = this.authService.verifyAccessToken(token);
      // return introspection-like response
      return {
        active: true,
        auth_id: payload.sub,
        email: payload.email,
        name: payload.name,
        roles: payload.globalRole ?? payload.clientRoles ?? [],
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch {
      return { active: false };
    }
  }
  @Post('signup/request-otp')
  @HttpCode(HttpStatus.OK)
    async requestSignupOtp(@Body() body: emailDTO) {
      try {
        
        const { email, clientId } = body;
        
        if (!email) {
          throw new BadRequestException('Email is required');
        }
        
        return this.authService.requestSignupOtp(email, clientId);
      } catch (error) {
        console.log(error);
        if(error instanceof HttpException){
          throw error;
        }else{
          throw new InternalServerErrorException("Something went wrong");
        }
      }
    }

    @Post('signup/verify-otp')
    @HttpCode(HttpStatus.OK)
    async verifySignupOtp(@Body() body: verifyDTO,@Res() res:any) {
      try {  
        console.log("Got user");
        const { email, otp,clientId } = body;
        
        const {newUser,onboarding_token} = await this.authService.verifySignupOtp(email, otp, clientId);

        res.cookie('onboarding_token',onboarding_token,{
          httpOnly: true,
          secure: process.env.NODE_ENV == 'production',
          // domain:process.env.COOKIE_DOMAIN || 'localhost',
          // path: '/',
          sameSite: process.env.COOKIE_SAME_SITE,
          maxAge: 15 * 60 * 1000,
        }); 
        return res.json({
          message:"User created successfully",
          user:newUser
        });

      } catch (error) {
          console.log(error);
      } 
    }
}

// src/auth/auth.controller.ts




/* helper copied */
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
