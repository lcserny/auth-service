import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseType } from 'typeorm';
import { Algorithm } from 'jsonwebtoken';

@Injectable()
export class CurrentConfig {

    application: AppConfig;
    database: DatabaseConfig;
    authentication: AuthConfig;
    
    constructor(private configService: ConfigService) {
        this.application = {
            name: this.configService.get<string>('application.name')!,
            port: this.configService.get<number>('application.port')!,
            path: this.configService.get<string>('application.path', "/"),
            log: {
                file: this.configService.get<string>('application.log.file', "auth-service-%DATE%.log"),
                level: this.configService.get<string>('application.log.level', "info"),
                json: this.configService.get<boolean>('application.log.json', false),
                size: this.configService.get<string>('application.log.size', "20m"),
                nrFiles: this.configService.get<string>('application.log.nrFiles', "14d"),
            },
        };

        this.database = {
            url: this.configService.get<string>("database.url")!,
            sync: this.configService.get<boolean>("database.sync")!,
            authSource: this.configService.get<string>("database.authSource", "admin"),
            type: this.configService.get<DatabaseType>("database.type", "mongodb"),
        };

        this.authentication = {
            algorithm: this.configService.get<Algorithm>('authentication.algorithm')!,
            privateKey: this.configService.get<string>('authentication.privateKey'),
            publicKey: this.configService.get<string>('authentication.publicKey'),
            secret: this.configService.get<string>('authentication.secret'),
            accessExpirationMinutes: this.configService.get<number>("authentication.accessExpirationMinutes", 15),
            refreshExpirationDays: this.configService.get<number>("authentication.refreshExpirationDays", 7),
            issuer: this.configService.get("authentication.issuer", "auth-service"),
            audience: this.configService.get("authentication.audience", "vm-services"),
            salt: this.configService.get<number | string>("authentication.salt", 10),
        };
    }
}
export interface AppConfig {
    name: string;
    port: number;
    path: string;
    log: LogConfig;
}

export interface LogConfig {
    file: string;
    level: string;
    json: boolean;
    size: string;
    nrFiles: string;
}

export interface DatabaseConfig {
    type: DatabaseType;
    authSource: string;
    url: string;
    sync: boolean;
}

export interface AuthConfig {
    algorithm: Algorithm;
    secret?: string;
    privateKey?: string;
    publicKey?: string;
    accessExpirationMinutes: number;
    refreshExpirationDays: number;
    issuer: string;
    audience: string;
    salt: number | string;
}