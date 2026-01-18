import type { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw new AppError(401, 'Authentication required');
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError(403, 'Insufficient permissions');
        }

        next();
    };
};
