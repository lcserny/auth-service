import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { CurrentConfig } from '../current.config';
import { AuthModule } from './auth.module';
import { getCustomRepositoryToken } from '@nestjs/typeorm';
import { instance, mock } from 'ts-mockito';
import { UserRepository } from '../users/user.repository';
import { RefreshTokenRepository } from './refreshtoken.repository';
import { Algorithm } from 'jsonwebtoken';

// TODO
describe('AuthService', () => {
    let service: AuthService;

    // config as needed
    const config = {
        authentication: {
            accessExpirationMinutes: 1,
            refreshExpirationDays: 1,
            issuer: 'test-issuer',
            audience: 'test-audience',
            secret: "testSecret",
            algorithm: "HS512" as Algorithm,
        },
        application: {
            path: '/',
        },
    };

    beforeEach(async () => {
        const userRepo = instance(mock(UserRepository));
        const tokenRepo = instance(mock(RefreshTokenRepository));

        // setup mock responses

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                JwtModule.register({
                    secret: config.authentication.secret,
                    signOptions: { algorithm: config.authentication.algorithm },
                    verifyOptions: { algorithms: [config.authentication.algorithm] },
                    global: true,
                }),
                AuthModule,
            ],
        })
                .overrideProvider(getCustomRepositoryToken(RefreshTokenRepository)).useValue(tokenRepo)
                .overrideProvider(getCustomRepositoryToken(UserRepository)).useValue(userRepo)
                .overrideProvider(CurrentConfig).useValue(config)
                .compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', async () => {
        expect(service).toBeDefined();
    });

    it('refresh date calc', async () => {
        const now = new Date();
        const beforeMonth = now.getMonth();
        now.setDate(now.getDate() + 40);

        expect(now.getMonth()).not.toBe(beforeMonth);
    });
});
