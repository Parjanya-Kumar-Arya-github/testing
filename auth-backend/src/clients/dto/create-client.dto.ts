import { IsArray, IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { AuthMode } from '@prisma/client';

export class CreateClientDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsArray()
    @IsString({ each: true })
    @IsUrl({ require_tld: false }, { each: true })
    redirectUris: string[];

    @IsNotEmpty()
    @IsEnum(AuthMode)
    authMode: AuthMode;
}
