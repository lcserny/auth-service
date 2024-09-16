import { MongoRepository } from 'typeorm';
import { User } from './user.entity';
import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserRepository {

    constructor(@InjectRepository(User) private repo: MongoRepository<User>) {
    }

    async get(userId: string): Promise<User | null> {
        const objId = new ObjectId(userId);
        return this.repo.findOneBy({ _id: objId });
    }

    async getAll(start: number, perPage: number): Promise<[User[], number]> {
        return this.repo.findAndCount({
            skip: start,
            take: perPage,
            order: {
                ["username"]: 'ASC',
            },
        });
    }

    async findOneByUsername(username: string): Promise<User | null> {
        return this.repo.findOneBy({
            username: username,
        });
    }

    async save(user: User): Promise<User> {
        return this.repo.save(user);
    }
}