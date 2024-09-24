import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PERMS_KEY, ROLES_KEY } from '../auth/auth.service';
import { UserPerm, UserRole } from './user.entity';
import { JwtService } from '@nestjs/jwt';
import { CurrentConfig } from '../current.config';

@Injectable()
export class UserGuard implements CanActivate {

    protected readonly logger = new Logger(UserGuard.name);

    protected readonly serviceName: string;
    protected readonly issuer: string;

    constructor(private jwtService: JwtService, private config: CurrentConfig) {
        this.serviceName = this.config.application.name;
        this.issuer = this.config.authentication.issuer;
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        const path = request.url;
        const method = request.method;

        if (!authHeader) {
            this.logger.warn("No authorization header present");
            return false;
        }

        const split = authHeader.split(" ");
        if (!split || split.length !== 2) {
            this.logger.warn(`No bearer auth header found: '${authHeader}'`);
            return false;
        }

        const token = split[1];

        try {
            const payload = this.jwtService.verify(token);
            const userId: string = payload.sub;
            const roles: UserRole[] = payload[ROLES_KEY];
            const perms: UserPerm[] = payload[PERMS_KEY];
            const issuer: string = payload.iss;
            const audience: string[] = payload.aud;

            if (!this.validate(userId, roles, perms, issuer, audience)) {
                this.logger.warn(`User with id '${userId}' tried to ${method} on protected path '${path}'`);
                return false;
            }
            return true;
        } catch (error: unknown) {
            this.logger.error((error as Error).stack);
            return false;
        }
    }

    protected validate(userId: string, roles: UserRole[], perms: UserPerm[], issuer: string, audience: string[]): boolean {
        if (!roles || !perms || perms.length === 0 || roles.length === 0) {
            return false;
        }

        if (roles.includes("ADMIN")) {
            return true;
        }

        if (perms.includes("READ")) {
            return true;
        }

        if (this.issuer !== issuer) {
            this.logger.warn(`User with id '${userId}' did not provide correct issuer, it provided: '${issuer}'`);
            return false;
        }

        if (!audience.includes(this.serviceName)) {
            this.logger.warn(`Token for User with id '${userId}' did not come from correct application, audience provided: '${audience}'`);
            return false;
        }

        return false;
    }
}

@Injectable()
export class AdminUserGuard extends UserGuard {

    protected validate(userId: string, roles: UserRole[], perms: UserPerm[], issuer: string, audience: string[]): boolean {
        if (!roles || !perms || perms.length === 0 || roles.length === 0) {
            return false;
        }

        if (this.issuer !== issuer) {
            this.logger.warn(`User with id '${userId}' did not provide correct issuer, it provided: '${issuer}'`);
            return false;
        }

        if (!audience.includes(this.serviceName)) {
            this.logger.warn(`Token for User with id '${userId}' did not come from correct application, audience provided: '${audience}'`);
            return false;
        }

        return roles.includes("ADMIN");
    }
}
