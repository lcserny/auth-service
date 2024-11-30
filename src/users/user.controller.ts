import {
    Body,
    Controller, Get, HttpCode,
    HttpStatus,
    Logger, Param,
    Post, Put, Query, Req,
    UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';
import { AdminUserGuard, UserGuard } from './user.guard';
import { convertToNumber } from '../app.module';
import { JwtService } from '@nestjs/jwt';
import { PERMS_KEY, ROLES_KEY } from '../auth/auth.service';
import {
    ApiResponse,
    CreateUserResourceApiInterface,
    GetSingleUserApiInterface,
    GetUserRequest,
    GetUsersRequest,
    GetUsersResourceApiInterface,
    NameValuePair,
    PaginatedUsers,
    RegisterRequest,
    UpdateSingleUserDataApiInterface,
    UpdateUserRequest,
    UserData,
    UserPerm,
    UserRegistration,
    UserRole,
} from '../generated';

@Controller("/users")
export class UserController implements
        CreateUserResourceApiInterface,
        GetSingleUserApiInterface,
        GetUsersResourceApiInterface,
        UpdateSingleUserDataApiInterface
{
    
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
    @HttpCode(HttpStatus.CREATED)
    async registerReal(@Body() userReg: UserRegistration): Promise<string> {
        this.logger.log(`Register request received for username: ${userReg.username}`)
        const user = await this.userService.createUser(userReg);
        return `User created with name: ${user.username}`;
    }

    // spec binding method
    async register(req: RegisterRequest): Promise<string> {
        return this.registerReal(req as UserRegistration);
    }

    // spec binding method
    async registerRaw(req: RegisterRequest): Promise<ApiResponse<string>> {
        throw new Error(`Stub method, no usage allowed ${req}`);
    }

    @UseGuards(AdminUserGuard)
    @Get()
    @HttpCode(HttpStatus.OK)
    async getUsersReal(@Query('page') page: string = '0',
                   @Query('perPage') perPage: string = '10',
                   @Query("username") username: string | undefined,
                   @Query("firstName") firstName: string | undefined,
                   @Query("lastName") lastName: string | undefined,
                   @Req() request: Request): Promise<PaginatedUsers> {
        this.logger.log(`Get all users request received`);

        const userAuth = this.getUserAuth(request);
        if (!userAuth.perms.includes("READ")) {
            throw new UnauthorizedException(`User with ID ${userAuth.userId} cannot get all users without READ permission`);
        }

        const pageInt = convertToNumber(page);
        const perPageInt = convertToNumber(perPage);

        const searchUsers: NameValuePair[] = [
            { name: "username", value: username },
            { name: "firstName", value: firstName },
            { name: "lastName", value: lastName }
        ];

        return this.userService.getPaginatedUsers(pageInt, perPageInt, searchUsers);
    }

    // spec binding method
    async getUsers(req: GetUsersRequest): Promise<PaginatedUsers> {
        const {page, limit, username, firstName, lastName} = req;
        return this.getUsersReal(page?.toString(), limit?.toString(), username, firstName, lastName, {} as Request);
    }

    // spec binding method
    async getUsersRaw(req: GetUsersRequest): Promise<ApiResponse<PaginatedUsers>> {
        throw new Error(`Stub method, no usage allowed ${req}`);
    }

    @UseGuards(UserGuard)
    @Get(":id")
    @HttpCode(HttpStatus.OK)
    async getUserReal(@Param('id') id: string, @Req() request: Request): Promise<UserData> {
        this.logger.log(`Get user with id ${id} request received`);

        const userAuth = this.getUserAuth(request);
        if (userAuth.userId !== id && !userAuth.roles.includes("ADMIN")) {
            throw new UnauthorizedException(`User with ID ${userAuth.userId} cannot get another user's data, only ADMIN allowed`);
        }

        if (!userAuth.perms.includes("READ")) {
            throw new UnauthorizedException(`User with ID ${userAuth.userId} cannot get user data without READ permission`);
        }

        return this.userService.getUser(id as string);
    }

    // spec binding method
    async getUser(req: GetUserRequest): Promise<UserData> {
        return this.getUserReal(req.id, {} as Request);
    }

    // spec binding method
    async getUserRaw(req: GetUserRequest): Promise<ApiResponse<UserData>> {
        throw new Error(`Stub method, no usage allowed ${req}`);
    }

    @UseGuards(UserGuard)
    @Put(":id")
    @HttpCode(HttpStatus.OK)
    async updateUserReal(@Param('id') id: string, @Body() userData: UserData, @Req() request: Request): Promise<UserData> {
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

        if (userAuth.roles.includes("ADMIN")) {
            return this.userService.updateUserExtra(id, userData);
        }
        return this.userService.updateUser(id, userData);
    }

    // spec binding method
    async updateUser(req: UpdateUserRequest): Promise<UserData> {
        return this.updateUserReal(req.id, req.userData!, {} as Request);
    }

    // spec binding method
    async updateUserRaw(req: UpdateUserRequest): Promise<ApiResponse<UserData>> {
        throw new Error(`Stub method, no usage allowed ${req}`);
    }
}