import {
    Body,
    Controller, Get,
    HttpStatus,
    Logger, Param,
    Post, Put, Query,
    Res, UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { AdminUserGuard, UserGuard } from './user.guard';
import { UserResponse } from '../generated/model/userResponse';
import { UserRegistration } from '../generated/model/userRegistration';
import { UserData } from '../generated/model/userData';
import { convertToNumber } from '../app.module';

@Controller("/users")
export class UserController {
    
    protected readonly logger = new Logger(UserController.name);

    constructor(private readonly userService: UserService) {
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

    @UseGuards(UserGuard)
    @Get()
    async getUsers(@Query('page') page: string = '0',
                   @Query('perPage') perPage: string = '10',
                   @Res() response: Response) {
        this.logger.log(`Get all users request received`);

        const pageInt = convertToNumber(page);
        const perPageInt = convertToNumber(perPage);

        const usersPage = await this.userService.getPaginatedUsers(pageInt, perPageInt);
        response.status(HttpStatus.OK).json(usersPage);
    }

    @UseGuards(UserGuard)
    @Get(":id")
    async getUser(@Param('id') id: string, @Res() response: Response) {
        this.logger.log(`Get user with id ${id} request received`);

        const user = await this.userService.getUser(id);
        response.status(HttpStatus.OK).json(user);
    }

    @UseGuards(AdminUserGuard)
    @Put(":id")
    async updateUser(@Param('id') id: string, @Body() userData: UserData, @Res() response: Response) {
        this.logger.log(`Update user with id ${id} request received`);

        const updatedUser = await this.userService.updateUser(id, userData);
        response.status(HttpStatus.OK).json(updatedUser);
    }
}