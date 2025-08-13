import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { CurrentConfig } from './current.config';
import { AppLogger } from './app.logger';
import { NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import { HttpErrorHandler } from './error.handler';
import * as fs from 'node:fs';

const enableSSL = "ENABLE_SSL";
const certPath = "SSL_CERT_PATH";
const keyPath = "SSL_KEY_PATH";

async function bootstrap() {
    const app = await createApp();
    const config = app.get(CurrentConfig);
    const logger = app.get(AppLogger);

    app.setGlobalPrefix(config.application.path);
    app.enableCors({
        credentials: true,
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS', 'DELETE'],
        allowedHeaders: ["Content-Type", "Authorization"]
    });
    app.use(cookieParser());
    app.useLogger(logger);
    app.useGlobalFilters(new HttpErrorHandler());
    // TODO: not working, should validate OpenAPI generated models
    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));

    logger.log(`${config.application.name} starting on port: ${config.application.port}`);

    await app.listen(config.application.port, '0.0.0.0');
}

async function createApp() {
    const isHttps = process.env[enableSSL] === 'true';
    const options: NestApplicationOptions = { bufferLogs: true };

    if (isHttps) {
        options.httpsOptions = {
            key: fs.readFileSync(getMandatoryEnvVar(keyPath), 'utf8'),
            cert: fs.readFileSync(getMandatoryEnvVar(certPath), 'utf8'),
        };
        console.log('🚀 Server running with SSL');
    } else {
        console.log('🚀 Server running without SSL');
    }

    return NestFactory.create(AppModule, options);
}

function getMandatoryEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return value;
}

bootstrap();
