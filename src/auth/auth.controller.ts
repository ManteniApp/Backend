/* eslint-disable prettier/prettier */
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(private readonly config: ConfigService) { }

    @Get('test-env')
    testEnv() {
        return {
            GOOGLE_CLIENT_ID: this.config.get('GOOGLE_CLIENT_ID'),
            GOOGLE_REDIRECT_URI: this.config.get('GOOGLE_REDIRECT_URI'),
        };
    }
}