import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Specify required GLOBAL roles for a route.
 * Uses Role enum from Prisma: ADMIN, USER, SUPERADMIN
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
