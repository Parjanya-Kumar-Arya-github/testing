import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtWrapperModule } from '../jwt/jwt.module';
import { ClientsModule } from '../clients/clients.module';
import { LoggingModule } from '../logging/logging.module';
import { SessionsService } from 'src/session/session.service';

@Module({
  imports: [PrismaModule, JwtWrapperModule, ClientsModule, LoggingModule],
  providers: [AuthService, SessionsService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
