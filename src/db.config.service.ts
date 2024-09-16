import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import { Injectable } from '@nestjs/common';
import { User } from './users/user.entity';
import { RefreshToken } from './auth/refreshtoken.entity';
import { CurrentConfig } from './current.config';

@Injectable()
export class DbConfigService {

    constructor(private config: CurrentConfig) {
    }

    createTypeOrmOptions(): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
        return {
            type: this.config.database.type,
            authSource: this.config.database.authSource,
            url: this.config.database.url,
            entities: [User, RefreshToken],
            synchronize: this.config.database.sync,
        };
    }
}