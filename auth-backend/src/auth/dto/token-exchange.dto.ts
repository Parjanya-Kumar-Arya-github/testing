import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TokenExchangeDto {
  @IsString()
  @IsNotEmpty()
  grant_type: 'authorization_code' | 'refresh_token';

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsString()
  client_secret?: string;

  @IsOptional()
  @IsString()
  refresh_token?: string;
}
