import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';
import { CurrentConfig } from '../current.config';
import {
    NameValuePair,
    PaginatedUsers,
    UserData,
    UserPerm,
    UserRegistration,
    UserRole,
    UserStatus,
} from '../generated';

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

    private async updateUserInternal(userId: string, data: UserData,
                                     updater: (user: User, data: UserData) => Promise<User>): Promise<UserData> {
        let user = await this.userRepository.get(userId);
        if (!user) {
            throw new NotFoundException();
        }

        user = await updater(user, data);
        user = await this.userRepository.save(user);

        return this.mapUser(user);
    }

    async updateUser(userId: string, data: UserData): Promise<UserData> {
        return this.updateUserInternal(userId, data, this.updateData);
    }

    async updateUserExtra(userId: string, data: UserData): Promise<UserData> {
        return this.updateUserInternal(userId, data, async (user, data) => {
            user = await this.updateData(user, data);
            return this.updateExtraData(user, data);
        });
    }

    private async updateData(user: User, data: UserData): Promise<User> {
        if (data.firstName) {
            user.firstName = data.firstName;
        }

        if (data.lastName) {
            user.lastName = data.lastName;
        }

        if (data.password && data.password.length > 0) {
            user.password = await bcrypt.hash(data.password, this.saltRounds);
        }

        return user;
    }

    private async updateExtraData(user: User, data: UserData): Promise<User> {
        if (data.roles) {
            user.roles = data.roles as UserRole[];
        }

        if (data.perms) {
            user.permissions = data.perms as UserPerm[];
        }

        if (data.status) {
            user.status = data.status as UserStatus;
        }

        if (data.created) {
            user.createdTimestamp = new Date(data.created);
        }

        return user;
    }

    private mapUser(user: User): UserData {
        return {
            id: user.id.toString(),
            username: user.username,
            password: "",
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
            perms: user.permissions,
            status: user.status,
            created: user.createdTimestamp
        };
    }

    async createUser(userReg: UserRegistration): Promise<User> {
        const hashedPass = await bcrypt.hash(userReg.password, this.saltRounds);

        const user = new User();
        user.username = userReg.username;
        user.password = hashedPass;
        user.firstName = userReg.firstName;
        user.lastName = userReg.lastName;
        user.status = "active";
        user.roles = ["STANDARD"];
        user.permissions = ["READ"];

        return this.userRepository.save(user);
    }

    async getPaginatedUsers(page: number, perPage: number, searchUsers: NameValuePair[]): Promise<PaginatedUsers> {
        const skip = page * perPage;
        const [users, total] = await this.userRepository.getAll(skip, perPage, searchUsers);

        const hasMore = (page + 1) < Math.ceil(total / perPage);
        const data = users.map(user => this.mapUser(user));

        return { data, hasMore, total };
    }
}