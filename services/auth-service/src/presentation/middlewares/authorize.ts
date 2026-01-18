import type { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(new AppError(401, 'Authentication required'));
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            next(new AppError(403, 'Insufficient permissions'));
            return;
        }

        next();
    };
};
