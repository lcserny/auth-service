import {
    Body,
    Controller,
    HttpStatus,
    Logger,
    Post, Req,
    Res,
} from '@nestjs/common';
import { AuthService, Tokens } from './auth.service';
import { Request, Response } from 'express';
import { CurrentConfig } from '../current.config';
import { UserRegistration } from '../generated/model/userRegistration';
import { UserAccess } from '../generated/model/userAccess';
import { UserResponse } from '../generated/model/userResponse';

const REFRESH_KEY = 'refreshToken';

@Controller('authenticate')
export class AuthController {

    protected readonly logger = new Logger(AuthController.name);

    private readonly contextPath: string;

    constructor(private authService: AuthService, private config: CurrentConfig) {
        this.contextPath = this.config.application.path;
    }

    @Post()
    async signIn(@Body() credentials: UserRegistration, @Res() response: Response){
        this.logger.log(`Login request received for username: ${credentials.username}`)

        const tokens = await this.authService.generateTokens(credentials.username, credentials.password);
        this.sendTokensResponse(tokens, response);
    }

    @Post("/refresh")
    async refresh(@Req() request: Request, @Res() response: Response){
        const refreshToken = request.cookies[REFRESH_KEY];
        this.logger.log(`Refresh request received for token: ${refreshToken}`)

        const tokens = await this.authService.validate(refreshToken);
        this.sendTokensResponse(tokens, response);
    }

    private sendTokensResponse(tokens: Tokens, response: Response) {
        response.cookie(REFRESH_KEY, tokens.refreshToken, {
            httpOnly: true,
            sameSite: "strict",
            path: this.contextPath,
            // I don't have a valid HTTPS certificate
            // secure: true,
            maxAge: this.authService.getMaxAgeMillis()
        });

        response.status(HttpStatus.OK).json({
            accessToken: tokens.accessToken,
            userId: tokens.userId,
            roles: tokens.roles,
            perms: tokens.perms
        } as UserAccess);
    }

    @Post("/logout")
    async signOut(@Req() request: Request, @Res() response: Response){
        const refreshToken = request.cookies[REFRESH_KEY];
        this.logger.log(`Logout request received for token: ${refreshToken}`)

        await this.authService.logout(refreshToken);
        response.clearCookie(REFRESH_KEY, { path: this.contextPath, });

        const status = HttpStatus.OK;
        response.status(status).json({
            message: `user logged out`,
            statusCode: status,
        } as UserResponse);
    }
}
