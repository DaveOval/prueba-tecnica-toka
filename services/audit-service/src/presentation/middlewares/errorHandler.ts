import type { Request, Response, NextFunction } from 'express';
import logger from '../../infrastructure/config/logger.js';

export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly isOperational: boolean = true
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export function errorHandler(
    error: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            error: {
                message: error.message,
                statusCode: error.statusCode,
            },
        });
        return;
    }

    logger.error({ 
        message: 'Unexpected error',
        error: error.message,
        stack: error.stack
    });
    res.status(500).json({
        error: {
            message: 'Internal server error',
            statusCode: 500,
        },
    });
}
