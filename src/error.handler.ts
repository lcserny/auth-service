import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ApplicationErrorResponse } from './generated';

const DEFAULT_CODE = 'no_code';

@Catch(Error)
export class HttpErrorHandler implements ExceptionFilter<Error> {

    private readonly logger = new Logger(HttpErrorHandler.name);

    catch(exception: Error, host: ArgumentsHost) {
        this.logger.error(exception.stack);

        const ctx = host.switchToHttp();
        // const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.BAD_REQUEST;
        if (exception instanceof HttpException) {
            status = exception.getStatus();
        }

        const error: ApplicationErrorResponse = {
            type: exception.name,
            message: exception.message,
            code: DEFAULT_CODE
        };
        response.status(status).json({error});
    }
}