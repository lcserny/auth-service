import { Injectable } from '@nestjs/common';
import { JwtModuleOptions } from '@nestjs/jwt/dist/interfaces/jwt-module-options.interface';
import * as fs from 'node:fs';
import { Algorithm } from 'jsonwebtoken';
import { CurrentConfig } from '../current.config';

@Injectable()
export class JwtConfigService {

    private readonly privateKey?: string;
    private readonly publicKey?: string;
    private readonly secret?: string;
    private readonly algorithm: Algorithm;

    constructor(private config: CurrentConfig) {
        this.algorithm = this.config.authentication.algorithm;
        this.secret = this.config.authentication.secret;

        if (!this.secret) {
            const privateKeyPath = this.config.authentication.privateKey;
            if (privateKeyPath) {
                this.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
            }
            const publicKeyPath = this.config.authentication.publicKey;
            if (publicKeyPath) {
                this.publicKey = fs.readFileSync(publicKeyPath, 'utf8');
            }
        }
    }

    createJwtOptions(): Promise<JwtModuleOptions> | JwtModuleOptions {
        // global options, can be overridden
        return {
            secret: this.secret,
            privateKey: this.privateKey,
            publicKey: this.publicKey,
            signOptions: {
                algorithm: this.algorithm
            },
            verifyOptions: {
                algorithms: [this.algorithm]
            }
        }
    }
}