import { IsArray, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { AuthMode } from '@prisma/client';

export class UpdateClientDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @IsUrl({ require_tld: false }, { each: true })
    redirectUris?: string[];

    @IsOptional()
    @IsEnum(AuthMode)
    authMode?: AuthMode;
}
