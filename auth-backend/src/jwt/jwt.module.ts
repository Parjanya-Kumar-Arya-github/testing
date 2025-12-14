import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtServiceWrapper } from './jwt.service';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  providers: [JwtServiceWrapper],
  exports: [JwtServiceWrapper],
})
export class JwtWrapperModule {}
