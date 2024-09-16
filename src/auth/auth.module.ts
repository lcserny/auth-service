import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/user.module';
import { RefreshTokenRepository } from './refreshtoken.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './refreshtoken.entity';
import { CurrentConfig } from '../current.config';

@Module({
    controllers: [AuthController],
    providers: [AuthService, RefreshTokenRepository, CurrentConfig],
    imports: [
        UsersModule,
        TypeOrmModule.forFeature([RefreshToken]),
    ],
    exports: [AuthService]
})
export class AuthModule {
}
