import {
    Body,
    Controller, HttpCode,
    HttpStatus,
    Logger,
    Post, Req, Res,
} from '@nestjs/common';
import { AuthService, Tokens } from './auth.service';
import { Request, Response } from 'express';
import { CurrentConfig } from '../current.config';
import {
    ApiResponse,
    LoginApiInterface, LogoutApiInterface, RefreshTokenApiInterface, ResponseMessage,
    SignInRequest,
    UserAccess,
    UserRegistration,
} from '../generated';

const SECONDS_IN_YEAR = 31556926;

@Controller('authenticate')
export class AuthController implements
        LoginApiInterface,
        RefreshTokenApiInterface,
        LogoutApiInterface
{

    protected readonly logger = new Logger(AuthController.name);

    private readonly contextPath: string;

    constructor(private authService: AuthService, private config: CurrentConfig) {
        this.contextPath = this.config.application.path;
    }

    @Post()
    @HttpCode(HttpStatus.OK)
    async signInReal(@Body() credentials: UserRegistration, @Req() request: Request, @Res() response: Response): Promise<UserAccess> {
        const userAgent = request.headers['user-agent'];
        this.logger.log(`Login request received for username: ${credentials.username} and agent: ${userAgent}`);
        const tokens = await this.authService.generateTokens(credentials.username, credentials.password, userAgent);

        response.cookie(this.config.authentication.refreshTokenName, tokens.refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            // secure: true, // I don't have a valid HTTPS certificate
            maxAge: SECONDS_IN_YEAR * 1000 // browser maxAge is in seconds BUT nestJS maxAge is in millis
        });

        return this.sendTokensResponse(tokens, response);
    }

    // spec binding method
    async signIn(req: SignInRequest): Promise<UserAccess> {
        return this.signInReal(req.userRegistration!, {} as Request, {} as Response);
    }

    // spec binding method
    async signInRaw(req: SignInRequest): Promise<ApiResponse<UserAccess>> {
        throw new Error(`Stub method, no usage allowed ${req}`);
    }

    @Post("/refresh")
    @HttpCode(HttpStatus.OK)
    async refreshReal(@Req() request: Request, @Res() response: Response): Promise<UserAccess> {
        const userAgent = request.headers['user-agent'];
        const refreshToken = request.cookies[this.config.authentication.refreshTokenName];
        this.logger.log(`Refresh request received for token: ${refreshToken} and agent: ${userAgent}`);
        const tokens = await this.authService.validate(refreshToken);
        return this.sendTokensResponse(tokens, response);
    }

    // spec binding method
    async refresh(): Promise<UserAccess> {
        return this.refreshReal({} as Request, {} as Response);
    }

    // spec binding method
    async refreshRaw(): Promise<ApiResponse<UserAccess>> {
        throw new Error(`Stub method, no usage allowed`);
    }

    private sendTokensResponse(tokens: Tokens, response: Response): UserAccess {
        const result: UserAccess = {
            accessToken: tokens.accessToken,
            expires: tokens.accessExpires,
            userId: tokens.userId,
            roles: tokens.roles,
            perms: tokens.perms
        };

        response.status(HttpStatus.OK).send(result);
        return result;
    }

    @Post("/logout")
    @HttpCode(HttpStatus.OK)
    async signOutReal(@Req() request: Request, @Res() response: Response): Promise<ResponseMessage> {
        const refreshToken = request.cookies[this.config.authentication.refreshTokenName];
        this.logger.log(`Logout request received for token: ${refreshToken}`)

        await this.authService.logout(refreshToken);
        response.clearCookie(this.config.authentication.refreshTokenName);

        const statusCode = HttpStatus.OK;
        const result = { message: "user logged out" };

        response.status(statusCode).send(result);
        return result
    }

    // spec binding method
    async signOut(): Promise<ResponseMessage> {
        return this.signOutReal({} as Request, {} as Response);
    }

    // spec binding method
    async signOutRaw(): Promise<ApiResponse<ResponseMessage>> {
        throw new Error(`Stub method, no usage allowed`);
    }
}
