import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  name?: string;
  type?: string;
  globalRole?: string[];
  clientId?: string;
  clientRoles?: string[];
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtServiceWrapper {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload as object, {
      secret: process.env.JWT_ACCESS_SECRET as string,
      expiresIn:'15m',
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return this.jwtService.verify<AccessTokenPayload>(token, {
      secret: process.env.JWT_ACCESS_SECRET as string,
    });
  }

  signRefreshToken(payload: { sub: string; tokenId?: string }): string {
    return this.jwtService.sign(payload as object, {
      secret: process.env.JWT_REFRESH_SECRET as string,
      expiresIn: '30d',
    });
  }

  verifyRefreshToken(token: string): { sub: string; tokenId?: string } {
    return this.jwtService.verify<{ sub: string; tokenId?: string }>(token, {
      secret: process.env.JWT_REFRESH_SECRET as string,
    });
  }

  signOnboardingToken(payload:{sub:string,tokenId?:string}){  
    return this.jwtService.sign(payload as object, {
      secret: process.env.JWT_ONBOARDING_SECRET as string,
      expiresIn: '15m',
    });
  }

  verifyOnboardingToken(token:string){
    return this.jwtService.verify<{ sub: string; tokenId?: string }>(token, {
      secret: process.env.JWT_ONBOARDING_SECRET as string,
    });
  }

}
