import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ClientsModule } from './clients/clients.module';
import {JwtModule, JwtService} from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { LoggingModule } from './logging/logging.module';
import { AllExceptionsFilter } from './globalfilter/allexception.filter';
import { JwtServiceWrapper } from './jwt/jwt.service';
import { JwtWrapperModule } from './jwt/jwt.module';
import { SessionModule } from './session/session.module';
import { IitdModule } from './iitd/iitd.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    PrismaModule, 
    ClientsModule,
    LoggingModule,
    IitdModule,
    AuthModule,
    JwtWrapperModule,
    SessionModule,
    MailModule
    ],
    
  controllers: [AppController],
  providers: [
    AppService,
    AllExceptionsFilter
  ],
})
export class AppModule {}
