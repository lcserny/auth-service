import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { UserResponse } from './generated/model/userResponse';

@Catch(Error)
export class HttpErrorHandler implements ExceptionFilter<Error> {

    private readonly logger = new Logger(HttpErrorHandler.name);

    catch(exception: Error, host: ArgumentsHost) {
        this.logger.error(exception.stack);

        const ctx = host.switchToHttp();
        // const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (exception instanceof HttpException) {
            status = exception.getStatus();
        }

        response.status(status).json({
            error: exception.name,
            message: exception.message,
            statusCode: status,
        } as UserResponse);
    }
}