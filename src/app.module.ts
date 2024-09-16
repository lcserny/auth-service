import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';
import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { DbConfigService } from './db.config.service';
import { CurrentConfig } from './current.config';
import { AppLogger } from './app.logger';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from './auth/jwt.config.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [configuration],
            cache: true,
            validationSchema: Joi.object({
                application: Joi.object({
                    name: Joi.string().required(),
                    port: Joi.number().required(),
                }),
                database: Joi.object({
                    url: Joi.string().required(),
                    sync: Joi.boolean().required(),
                }),
                authentication: Joi.object({
                    privateKey: Joi.string().required(),
                    publicKey: Joi.string().required(),
                }),
            }),
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            useClass: DbConfigService,
            extraProviders: [CurrentConfig],
        }),
        JwtModule.registerAsync({
            useClass: JwtConfigService,
            extraProviders: [CurrentConfig],
            global: true
        }),
        UsersModule,
        AuthModule,
    ],
    providers: [AppLogger, CurrentConfig],
    exports: [CurrentConfig]
})
export class AppModule {
}

export function convertToNumber(nr: string): number {
    const int = parseInt(nr);
    if (Number.isNaN(int)) {
        throw new Error(`Cannot convert string to number: '${nr}'`);
    }
    return int;
}
