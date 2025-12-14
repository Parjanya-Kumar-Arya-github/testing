import { IsEmail, IsString } from "class-validator";

export class emailDTO{
    @IsEmail()
    email:string

    @IsString()
    clientId:string
}

export class verifyDTO{
    @IsEmail()
    email:string

    @IsString()
    clientId:string

    @IsString()
    otp:string
}