import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../users/user.repository';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './refreshtoken.entity';
import { RefreshTokenRepository } from './refreshtoken.repository';
import { User } from '../users/user.entity';
import { CurrentConfig } from '../current.config';
import { UserPerm, UserRole } from '../generated';
import { addDays, addMinutes, getTime } from 'date-fns';

export interface Tokens {
    accessToken: string,
    refreshToken: string,
    userId: string,
    roles: UserRole[],
    perms: UserPerm[],
}

export const ROLES_KEY = "roles";
export const PERMS_KEY = "perms";

@Injectable()
export class AuthService {

    private readonly logger = new Logger(AuthService.name);

    private readonly accessExpMin: number;
    private readonly refreshExpDays: number;
    private readonly issuer: string;
    private readonly audience: string[];

    constructor(private userRepository: UserRepository,
                private refreshTokenRepository: RefreshTokenRepository,
                private jwtService: JwtService,
                private config: CurrentConfig) {
        this.accessExpMin = this.config.authentication.accessExpirationMinutes;
        this.refreshExpDays = this.config.authentication.refreshExpirationDays;
        this.issuer = this.config.authentication.issuer;
        this.audience = this.config.authentication.audience;
    }

    async generateTokens(name: string, pass: string, userAgent?: string): Promise<Tokens> {
        const user = await this.userRepository.findOneByUsername(name);
        if (!user || user.status === "inactive") {
            throw new NotFoundException();
        }

        const verified = await bcrypt.compare(pass, user.password);
        if (!verified) {
            throw new UnauthorizedException();
        }

        const accessToken = await this.createAccessToken(user);
        const refreshToken = await this.createRefreshToken(user, userAgent);

        return { accessToken, refreshToken, userId: user.id.toString(), roles: user.roles, perms: user.permissions };
    }

    private async createAccessToken(user: User): Promise<string> {
        const iat = new Date();
        const iatSeconds = Math.floor(getTime(iat) / 1000);
        const exp = addMinutes(iat, this.accessExpMin);
        const expSeconds = Math.floor(getTime(exp) / 1000);

        return this.jwtService.signAsync({
            sub: user.id.toString(),
            exp: expSeconds,
            iat: iatSeconds,
            iss: this.issuer,
            aud: this.audience,
            [ROLES_KEY]: user.roles,
            [PERMS_KEY]: user.permissions,
        });
    }

    private async createRefreshToken(user: User, userAgent?: string): Promise<string> {
        let refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.createdTimestamp = new Date();
        refreshTokenEntity.revoked = false;
        refreshTokenEntity.userId = user.id;
        refreshTokenEntity.userAgent = userAgent || "";

        let expTime = new Date();
        expTime = addDays(expTime, this.refreshExpDays);
        refreshTokenEntity.expirationTimestamp = expTime;

        refreshTokenEntity = await this.refreshTokenRepository.save(refreshTokenEntity);

        return this.jwtService.signAsync({
            sub: refreshTokenEntity.userId.toString(),
            iat: Math.floor(refreshTokenEntity.createdTimestamp.getTime() / 1000),
            exp: Math.floor(refreshTokenEntity.expirationTimestamp.getTime() / 1000),
            jti: refreshTokenEntity.id.toString(),
        });
    }

    async validate(refreshToken?: string): Promise<Tokens> {
        if (!refreshToken) {
            throw new Error('No JWT token passed');
        }

        const verifiedPayload = await this.jwtService.verifyAsync(refreshToken);
        if (!verifiedPayload.jti) {
            throw new BadRequestException("jti claim not found in decoded JWT");
        }

        const tokenId = verifiedPayload.jti as string;
        const foundToken = await this.refreshTokenRepository.get(tokenId);
        if (!foundToken) {
            throw new NotFoundException();
        }

        if (foundToken.revoked) {
            throw new UnauthorizedException(`token with id ${tokenId} is revoked`);
        }

        const user = await this.userRepository.get(foundToken.userId.toString());
        if (!user || user.status === "inactive") {
            throw new NotFoundException(`userId from token with id ${tokenId} is invalid`);
        }

        const accessToken = await this.createAccessToken(user);

        return { accessToken, refreshToken, userId: user.id.toString(), roles: user.roles, perms: user.permissions };
    }

    async logout(refreshToken?: string) {
        if (!refreshToken) {
            throw new Error('No JWT token passed');
        }

        const verifiedPayload = await this.jwtService.verifyAsync(refreshToken);
        if (!verifiedPayload.jti) {
            throw new BadRequestException("jti claim not found in decoded JWT");
        }

        const tokenId = verifiedPayload.jti;
        this.logger.log(`Revoking refresh token with id ${tokenId}`);
        await this.refreshTokenRepository.revokeToken(tokenId);
    }
}
