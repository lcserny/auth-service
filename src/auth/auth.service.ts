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
import { ObjectId } from 'mongodb';
import { CurrentConfig } from '../current.config';

export interface Tokens {
    accessToken: string,
    refreshToken: string,
    userId: string,
    roles: string[],
    perms: string[],
}

const MAX_AGE_THRESHOLD = 10000; // 10 seconds

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

    async generateTokens(name: string, pass: string): Promise<Tokens> {
        const user = await this.userRepository.findOneByUsername(name);
        if (!user || user.status === "inactive") {
            throw new NotFoundException();
        }

        const verified = await bcrypt.compare(pass, user.password);
        if (!verified) {
            throw new UnauthorizedException();
        }

        const accessToken = await this.createAccessToken(user);
        const refreshToken = await this.createRefreshToken(user);

        return { accessToken, refreshToken, userId: user.id.toString(), roles: user.roles, perms: user.permissions };
    }

    private async createAccessToken(user: User): Promise<string> {
        const accessCreation = new Date();
        const accessExpiration = new Date();
        accessExpiration.setUTCMinutes(accessExpiration.getUTCMinutes() + this.accessExpMin);

        const accessTokenPayload = {
            sub: user.id.toString(),
            exp: Math.floor(accessExpiration.getTime() / 1000), // seconds
            iat: Math.floor(accessCreation.getTime() / 1000), // seconds
            iss: this.issuer,
            aud: this.audience,
            [ROLES_KEY]: user.roles,
            [PERMS_KEY]: user.permissions,
        };
        return this.jwtService.signAsync(accessTokenPayload);
    }

    private async createRefreshToken(user: User, exp?: Date): Promise<string> {
        let refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.createdTimestamp = new Date();
        refreshTokenEntity.revoked = false;
        refreshTokenEntity.userId = new ObjectId(user.id.toString());

        if (exp) {
            refreshTokenEntity.expirationTimestamp = exp;
        } else {
            refreshTokenEntity.expirationTimestamp = new Date();
            refreshTokenEntity.expirationTimestamp.setUTCDate(refreshTokenEntity.expirationTimestamp.getUTCDate() + this.refreshExpDays);
        }

        refreshTokenEntity = await this.refreshTokenRepository.save(refreshTokenEntity);

        const refreshTokenPayload = {
            sub: refreshTokenEntity.userId.toString(),
            iat: Math.floor(refreshTokenEntity.createdTimestamp.getTime() / 1000),
            exp: Math.floor(refreshTokenEntity.expirationTimestamp.getTime() / 1000),
            jti: refreshTokenEntity.id.toString(),
        };
        return this.jwtService.signAsync(refreshTokenPayload);
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

        await this.refreshTokenRepository.revokeToken(tokenId);

        const accessToken = await this.createAccessToken(user);
        const newRefreshToken = await this.createRefreshToken(user, foundToken.expirationTimestamp);

        return { accessToken, refreshToken: newRefreshToken, userId: user.id.toString(), roles: user.roles, perms: user.permissions };
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

    public getMaxAgeMillis() {
        return this.refreshExpDays * 24 * 60 * 60 * 1000 + MAX_AGE_THRESHOLD;
    }
}
