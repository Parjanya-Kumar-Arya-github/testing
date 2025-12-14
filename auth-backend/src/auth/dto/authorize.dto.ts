import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class AuthorizeQueryDto {
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsString()
  redirect_uri: string;

  @IsOptional()
  @IsString()
  requested_role?: string;

  @IsOptional()
  @IsString()
  state?: string;

}
