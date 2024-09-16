import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PERMS_KEY, ROLES_KEY } from '../auth/auth.service';
import { UserPerm, UserRole } from './user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserGuard implements CanActivate {

    private readonly logger = new Logger(UserGuard.name);

    constructor(protected jwtService: JwtService) {
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
            const userId = payload.sub;
            const roles = payload[ROLES_KEY];
            const perms = payload[PERMS_KEY];

            if (!this.validate(roles, perms)) {
                this.logger.warn(`User with id '${userId}' tried to ${method} on protected path '${path}'`);
                return false;
            }
            return true;
        } catch (error: unknown) {
            this.logger.error((error as Error).stack);
            return false;
        }
    }

    protected validate(roles: UserRole[], perms: UserPerm[]): boolean {
        if (!roles || !perms || perms.length === 0 || roles.length === 0) {
            return false;
        }

        if (roles.includes("ADMIN")) {
            return true;
        }

        if (perms.includes("READ")) {
            return true;
        }

        // add other validations

        return false;
    }
}

@Injectable()
export class AdminUserGuard extends UserGuard {

    protected validate(roles: UserRole[], perms: UserPerm[]): boolean {
        if (!roles || !perms || perms.length === 0 || roles.length === 0) {
            return false;
        }
        return roles.includes("ADMIN");
    }
}
