import type { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

/**
 * Middleware que permite acceso solo si:
 * - El usuario es admin, O
 * - El usuario está intentando acceder a su propio perfil (req.params.id === req.user.userId)
 */
export const canAccessProfile = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        next(new AppError(401, 'Authentication required'));
        return;
    }

    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    // Admin puede acceder a cualquier perfil, usuarios normales solo al suyo
    if (!isAdmin && id !== userId) {
        next(new AppError(403, 'You can only access your own profile'));
        return;
    }

    next();
};
