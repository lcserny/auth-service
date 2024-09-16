import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserPerm, UserRole, UserStatus } from './user.entity';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';
import { CurrentConfig } from '../current.config';
import { UserData } from '../generated/model/userData';
import { UserRegistration } from '../generated/model/userRegistration';
import { PaginatedUsers } from '../generated/model/paginatedUsers';

@Injectable()
export class UserService {

    private readonly saltRounds: number | string;

    constructor(private userRepository: UserRepository, private config: CurrentConfig) {
        this.saltRounds = this.config.authentication.salt;
    }

    async getUser(userId: string): Promise<UserData> {
        const user = await this.userRepository.get(userId);
        if (!user) {
            throw new NotFoundException();
        }
        return this.mapUser(user);
    }

    async updateUser(userId: string, data: UserData): Promise<UserData> {
        let user = await this.userRepository.get(userId);
        if (!user) {
            throw new NotFoundException();
        }

        user = this.updateData(user, data);
        user = await this.userRepository.save(user);

        return this.mapUser(user);
    }

    private updateData(user: User, data: UserData): User {
        if (data.username) {
            user.username = data.username;
        }

        if (data.firstName) {
            user.firstName = data.firstName;
        }

        if (data.lastName) {
            user.lastName = data.lastName;
        }

        if (data.roles) {
            user.roles = data.roles as UserRole[];
        }

        if (data.perms) {
            user.permissions = data.perms as UserPerm[];
        }

        if (data.status) {
            user.status = data.status as UserStatus;
        }

        return user;
    }

    private mapUser(user: User): UserData {
        return {
            id: user.id.toString(),
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
            perms: user.permissions,
            status: user.status,
            created: user.createdTimestamp.toISOString()
        };
    }

    async createUser(userReg: UserRegistration): Promise<User> {
        const hashedPpass = await bcrypt.hash(userReg.password, this.saltRounds);

        const user = new User();
        user.username = userReg.username;
        user.password = hashedPpass;
        user.firstName = userReg.firstName;
        user.lastName = userReg.lastName;
        user.status = "active";
        user.roles = ["STANDARD"];
        user.permissions = ["READ"];

        return this.userRepository.save(user);
    }

    async getPaginatedUsers(page: number, perPage: number): Promise<PaginatedUsers> {
        const skip = page * perPage;
        const [users, total] = await this.userRepository.getAll(skip, perPage);

        const hasMore = (page + 1) < Math.ceil(total / perPage);
        const data = users.map(user => this.mapUser(user));

        return { data, page, hasMore };
    }
}