import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtServiceWrapper } from '../../jwt/jwt.service';

import type { RequestUser } from '../interfaces/request-user.interface';
import { AppLoggerService } from 'src/logging/logging.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly context = JwtAuthGuard.name;

  constructor(
    private readonly jwtService: JwtServiceWrapper,
    private readonly logger: AppLoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();

    const token = this.extractTokenFromRequest(request);
    if (!token) {
      this.logger.warnWithContext(this.context, 'Missing access token');
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const payload = this.jwtService.verifyAccessToken(token);
      // Attach payload to request.user
      (request as any).user = payload as RequestUser;

      this.logger.debugWithContext(this.context, 'Access token validated', {
        userId: payload.sub,
        clientId: payload.clientId,
      });

      return true;
    } catch (err) {
      this.logger.warnWithContext(this.context, 'Invalid access token');
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractTokenFromRequest(req: Request): string | undefined {
    // 1) Authorization header
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    // 2) Cookie
    const cookieName =
      process.env.COOKIE_ACCESS_NAME || 'access_token';

    const cookies = (req as any).cookies || {};
    if (cookies[cookieName]) {
      return cookies[cookieName];
    }

    return undefined;
  }
}
