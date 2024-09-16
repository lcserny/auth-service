import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { CurrentConfig } from './current.config';
import 'winston-daily-rotate-file';
import * as process from 'node:process';

const { combine, timestamp, prettyPrint, printf, errors } = winston.format;

@Injectable()
export class AppLogger implements LoggerService {

    private readonly logger: winston.Logger;

    // use app name in log pattern?
    constructor(private config: CurrentConfig) {
        this.logger = winston.createLogger();
        this.logger.level = this.config.application.log.level;
        this.logger.format = combine(errors({stack: true}), timestamp(), this.config.application.log.json
                ? prettyPrint()
                : printf(({timestamp, level, message, stack}) => {
                    const text = `${timestamp} ${level.toUpperCase()} ${message}`;
                    return stack ? text + '\n' + stack : text;
                }));
        this.logger.add(new winston.transports.Console());
        this.logger.add(new winston.transports.DailyRotateFile({
            filename: this.config.application.log.file,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: this.config.application.log.size,
            maxFiles: this.config.application.log.nrFiles,
        }));
    }

    log(message: any) {
        this.logger.info(message);
    }

    error(message: any, trace?: string) {
        this.logger.error(message, { trace });
    }

    warn(message: any) {
        this.logger.warn(message);
    }

    debug(message: any) {
        this.logger.debug(message);
    }

    verbose(message: any) {
        this.logger.verbose(message);
    }

    fatal?(message: any, trace?: string) {
        this.error(message, trace);
        process.exit(1);
    }
}