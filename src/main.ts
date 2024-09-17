import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { CurrentConfig } from './current.config';
import { AppLogger } from './app.logger';
import { ValidationPipe } from '@nestjs/common';
import { HttpErrorHandler } from './error.handler';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true
    });
    const config = app.get(CurrentConfig);
    const logger = app.get(AppLogger);

    app.setGlobalPrefix(config.application.path);
    // TODO doesn't work
    app.enableCors({
        credentials: true,
        // TODO: get from config
        // origin: "http://localhost:4200",
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
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

    await app.listen(config.application.port);
}

bootstrap();
