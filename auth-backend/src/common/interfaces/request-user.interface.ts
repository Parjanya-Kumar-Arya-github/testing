import type { AccessTokenPayload } from '../../jwt/jwt.service';

export interface RequestUser extends AccessTokenPayload {
  iat?: number;
  exp?: number;
}
