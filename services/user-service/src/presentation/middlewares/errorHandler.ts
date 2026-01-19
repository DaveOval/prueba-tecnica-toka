import type { Request, Response, NextFunction } from "express";
import logger from '../../infrastructure/config/logger.js';


export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational: boolean = true,
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export const errorHandler = (
    err: Error | AppError,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status: false,
            error: {
                message: err.message,
                statusCode: err.statusCode,
            },
        });
        return;
    }

    logger.error({ 
        message: 'Unexpected error',
        error: err.message,
        stack: err.stack
    });
    res.status(500).json({
        status: false,
        error: {
            message: "Internal server error",
            statusCode: 500,
        },
    });
};
