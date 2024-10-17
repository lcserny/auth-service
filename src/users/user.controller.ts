import {
    Body,
    Controller, Get,
    HttpStatus,
    Logger, Param,
    Post, Put, Query, Req,
    Res, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Response, Request } from 'express';
import { AdminUserGuard, UserGuard } from './user.guard';
import { UserResponse } from '../generated/model/userResponse';
import { UserRegistration } from '../generated/model/userRegistration';
import { UserData } from '../generated/model/userData';
import { convertToNumber } from '../app.module';
import { JwtService } from '@nestjs/jwt';
import { UserPerm, UserRole } from './user.entity';
import { PERMS_KEY, ROLES_KEY } from '../auth/auth.service';

@Controller("/users")
export class UserController {
    
    protected readonly logger = new Logger(UserController.name);

    constructor(private readonly userService: UserService,
                private readonly jwtService: JwtService) {
    }

    private getUserAuth(request: Request) {
        const token = request.headers["authorization"]!.split(" ")[1];
        const payload = this.jwtService.verify(token);
        const userId: string = payload.sub;
        const perms: UserPerm[] = payload[PERMS_KEY];
        const roles: UserRole[] = payload[ROLES_KEY];

        return { userId, perms, roles };
    }

    @Post()
    async register(@Body() userReg: UserRegistration, @Res() response: Response){
        this.logger.log(`Register request received for username: ${userReg.username}`)

        const user = await this.userService.createUser(userReg);

        const status = HttpStatus.CREATED;
        response.status(status).json({
            message: `User created with name: ${user.username}`,
            statusCode: status,
        } as UserResponse);
    }

    @UseGuards(AdminUserGuard)
    @Get()
    async getUsers(@Query('page') page: string = '0',
                   @Query('perPage') perPage: string = '10',
                   @Req() request: Request,
                   @Res() response: Response) {
        this.logger.log(`Get all users request received`);

        const userAuth = this.getUserAuth(request);
        if (!userAuth.perms.includes("READ")) {
            throw new UnauthorizedException(`User with ID ${userAuth.userId} cannot get all users without READ permission`);
        }

        const pageInt = convertToNumber(page);
        const perPageInt = convertToNumber(perPage);

        const usersPage = await this.userService.getPaginatedUsers(pageInt, perPageInt);
        response.status(HttpStatus.OK).json(usersPage);
    }

    @UseGuards(UserGuard)
    @Get(":id")
    async getUser(@Param('id') id: string, @Res() response: Response, @Req() request: Request) {
        this.logger.log(`Get user with id ${id} request received`);

        const userAuth = this.getUserAuth(request);
        if (userAuth.userId !== id && !userAuth.roles.includes("ADMIN")) {
            throw new UnauthorizedException(`User with ID ${userAuth.userId} cannot get another user's data, only ADMIN allowed`);
        }

        if (!userAuth.perms.includes("READ")) {
            throw new UnauthorizedException(`User with ID ${userAuth.userId} cannot get user data without READ permission`);
        }

        const user = await this.userService.getUser(id);
        response.status(HttpStatus.OK).json(user);
    }

    @UseGuards(UserGuard)
    @Put(":id")
    async updateUser(@Param('id') id: string, @Body() userData: UserData,
                     @Res() response: Response, @Req() request: Request) {
        this.logger.log(`Update user with id ${id} request received`);

        const userAuth = this.getUserAuth(request);
        if (userAuth.userId !== id && !userAuth.roles.includes("ADMIN")) {
            throw new UnauthorizedException(`User with ID ${userAuth.userId} cannot update another user's data, only ADMIN allowed`);
        }

        if (!userAuth.perms.includes("WRITE")) {
            throw new UnauthorizedException(`User with ID ${userAuth.userId} cannot update user data without WRITE permission`);
        }

        if (userAuth.roles.includes("GUEST")) {
            throw new UnauthorizedException(`Guest user with ID ${userAuth.userId} cannot update user data`);
        }

        let updatedUser: UserData;
        if (userAuth.roles.includes("ADMIN")) {
            updatedUser = await this.userService.updateUserExtra(id, userData);
        } else {
            updatedUser = await this.userService.updateUser(id, userData);
        }

        response.status(HttpStatus.OK).json(updatedUser);
    }
}