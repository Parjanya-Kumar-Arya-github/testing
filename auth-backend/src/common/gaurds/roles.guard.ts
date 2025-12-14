import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { RequestUser } from '../interfaces/request-user.interface';
import { AppLoggerService } from 'src/logging/logging.service';
import { Reflector } from '@nestjs/core';
import { RequestWithUser } from 'src/types/RequestWithUser';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly context = RolesGuard.name;

  constructor(
    private readonly reflector: Reflector,
    private readonly logger: AppLoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    // If no roles specified → allow (only JWT guard will run)
    if (requiredRoles.length === 0) {
      return true;
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<RequestWithUser>();
    const user = request.user as RequestUser | undefined;

    if (!user) {
      this.logger.warnWithContext(this.context, 'No user found in request');
      throw new ForbiddenException('User not authenticated');
    }

    const userRoles = user.globalRole || [];

    const hasRole = requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasRole) {
      this.logger.warnWithContext(this.context, 'User lacks required roles', {
        userId: user.sub,
        requiredRoles,
        userRoles,
      });
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
