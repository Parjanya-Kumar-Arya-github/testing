import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { IitdService } from './iitd.service';

@Controller('iitd')
export class IitdController {
  constructor(private readonly iitdService: IitdService) {}

  @Get('/oauth/redirect')
  async oauthRedirect(
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('requested_role') requestedRole: string,
    @Res() res: Response,
  ) {
    if (!clientId || !redirectUri) {
      throw new BadRequestException('Missing client_id or redirect_uri');
    }

    const statePayload = {
      clientId,
      redirectUri,
      requestedRole: requestedRole || null,
    };
    
    const encodedState = Buffer.from(JSON.stringify(statePayload), 'utf8').toString('base64url');
    const authorizationUrl = this.iitdService.getAuthorizationUrl(encodedState);

    return res.redirect(authorizationUrl);
  }

  @Get('/oauth/callback')
  async oauthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state');
    }

    try {
      const { 
        redirectUri, 
        accessToken, 
        refreshToken 
      } = await this.iitdService.handleOAuthCallback(code, state);

      const cookieName = process.env.COOKIE_REFRESH_NAME || 'refresh_token';
      const cookieSecure = process.env.COOKIE_SECURE === 'true';
      const sameSite = (process.env.COOKIE_SAME_SITE as 'lax' | 'none' | 'strict') || 'lax';
      const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

      res.cookie(cookieName, refreshToken, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite,
        domain: cookieDomain,
        maxAge: 30 * 24 * 60 * 60 * 1000, 
      });
      
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite,
        domain: cookieDomain,
        maxAge: 30 * 24 * 60 * 60 * 1000, 
      });

      const finalRedirectUrl = new URL(redirectUri);
      finalRedirectUrl.searchParams.set('access_token', accessToken);

      return res.redirect(finalRedirectUrl.toString());

    } catch (err: any) {
      const message = err?.message || 'OAuth authentication failed';
      return res.redirect(`/unauthorised?error=${encodeURIComponent(message)}`);
    }
  }
}