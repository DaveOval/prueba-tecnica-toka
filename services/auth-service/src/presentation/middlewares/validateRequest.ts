import type { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler.js";

export const validateRequest = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError(400, "Email and password are required");
    }

    if (typeof email !== "string" || typeof password !== "string") {
        throw new AppError(400, "Email and password must be strings");
    }

    if (!email.includes("@")) {
        throw new AppError(400, "Invalid email format");
    }

    if (password.length < 8) {
        throw new AppError(400, "Password must be at least 8 characters long");
    }

    next();
};


export const validateLoginRequest = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError(400, "Email and password are required");
    }

    if (typeof email !== "string" || typeof password !== "string") {
        throw new AppError(400, "Email and password must be strings");
    }

    if (!email.includes("@")) {
        throw new AppError(400, "Invalid email format");
    }
    
    next();
}