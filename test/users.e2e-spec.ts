import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { AdminUserGuard, UserGuard } from '../src/users/user.guard';
import { CurrentConfig } from '../src/current.config';
import { ConfigModule } from '@nestjs/config';
import configuration from '../src/configuration';

const MAPPED_PORT = 27017;
const USER = 'root';
const PASS = 'rootpass';

jest.setTimeout(30000);

// TODO
describe('UserController (e2e)', () => {
    let app: INestApplication;

    let container: StartedTestContainer;
    let mongoUrl: string;

    beforeAll(async () => {
        container = await new GenericContainer('mongo:7.0')
                .withExposedPorts(MAPPED_PORT)
                .withEnvironment({
                    'MONGO_INITDB_ROOT_USERNAME': USER,
                    'MONGO_INITDB_ROOT_PASSWORD': PASS,
                })
                .withStartupTimeout(10000)
                .withWaitStrategy(Wait.forLogMessage('Waiting for connections'))
                .start();

        mongoUrl = `mongodb://${USER}:${PASS}@${container.getHost()}:${container.getMappedPort(MAPPED_PORT)}/?retryWrites=true&w=majority`;
    });

    beforeEach(async () => {
        const tmpFixture = await Test.createTestingModule({imports: [OriginalConfigModule]}).compile();
        const originalConfig = tmpFixture.get<CurrentConfig>(CurrentConfig);
        const config = {
            ...originalConfig,
            database: {
                url: mongoUrl,
                sync: true,
                type: "mongodb",
            }
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ AppModule ],
        })
                .overrideProvider(CurrentConfig).useValue(config)
                .overrideGuard(UserGuard).useValue({ canActivate: () => true })
                .overrideGuard(AdminUserGuard).useValue({ canActivate: () => true })
                .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
        await container.stop();
    });

    it('GET /users', () => {
        return request(app.getHttpServer())
                .get('/users')
                .expect(200);
    });
});

// workaround for providing config to replace partially
@Module({
    imports: [ ConfigModule.forRoot({ load: [configuration] }) ],
    providers: [CurrentConfig],
    exports: [CurrentConfig],
})
export class OriginalConfigModule {}
