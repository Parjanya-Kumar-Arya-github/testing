import { Module } from '@nestjs/common';
import { IitdService } from './iitd.service';
import { IitdController } from './iitd.controller';
import { JwtWrapperModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    PrismaModule,
    JwtWrapperModule,
    ClientsModule,
  ],
  providers: [IitdService],
  controllers: [IitdController],
})
export class IitdModule {}
