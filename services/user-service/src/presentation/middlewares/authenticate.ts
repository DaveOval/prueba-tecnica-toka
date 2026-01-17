import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: string;
            };
        }
    }
}

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(401, 'No token provided');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const secret = process.env.JWT_ACCESS_SECRET || 'access-secret';

        const decoded = jwt.verify(token, secret) as {
            userId: string;
            email: string;
            role: string;
        };

        // Agregar información del usuario al request
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role || 'user',
        };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            next(error);
            return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
            next(new AppError(401, 'Invalid token'));
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            next(new AppError(401, 'Token expired'));
            return;
        }
        next(new AppError(401, 'Authentication failed'));
    }
};
