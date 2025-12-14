import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transport = nodemailer.createTransport({
        host: process.env.MAIL_SERVICE || 'smtp.iitd.ac.in',
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    async sendMail(to: string, subject: string, htmlString?: string) {
        try {
            await this.transport.sendMail({
                from: process.env.MAIL_USER,
                to,
                subject,
                html: htmlString
            });
        } catch (error: any) {
            
            console.log(error);
            
            if(error.code == "EAUTH"){
                console.log("Email Auth Failed");
            }
            if (error) {
                throw new InternalServerErrorException("Email Service is down from our side. Please try again later!");
            }
        }
    }
}
