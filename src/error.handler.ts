import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
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

        const error: ApplicationErrorResponse = {
            error: exception.name,
            message: exception.message,
            code: DEFAULT_CODE
        };
        response.status(HttpStatus.BAD_REQUEST).json({error});
    }
}