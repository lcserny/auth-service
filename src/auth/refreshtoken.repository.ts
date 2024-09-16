import { Injectable } from '@nestjs/common';
import { RefreshToken } from './refreshtoken.entity';
import { MongoRepository } from 'typeorm';
import { ObjectId, UpdateResult, Document } from 'mongodb';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RefreshTokenRepository {

    constructor(@InjectRepository(RefreshToken) private repo: MongoRepository<RefreshToken>) {
    }

    async get(tokenId: string): Promise<RefreshToken | null> {
        const objId = new ObjectId(tokenId);
        return this.repo.findOneBy({ _id: objId });
    }

    async save(token: RefreshToken): Promise<RefreshToken> {
        return this.repo.save(token);
    }

    async revokeToken(tokenId: string): Promise<Document | UpdateResult> {
        const objId = new ObjectId(tokenId);
        return this.repo.updateOne({
            _id: objId
        }, {
            $set: {
                revoked: true
            }
        });
    }
}