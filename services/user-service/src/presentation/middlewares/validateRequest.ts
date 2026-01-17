import type { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler.js";

export const validateCreateUserProfile = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const { id, email } = req.body;

    if (!id || !email) {
        throw new AppError(400, "Id and email are required");
    }

    if (typeof id !== "string" || typeof email !== "string") {
        throw new AppError(400, "Id and email must be strings");
    }

    if (!email.includes("@")) {
        throw new AppError(400, "Invalid email format");
    }

    next();
};

export const validateUpdateUserProfile = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const { firstName, lastName, phone, address } = req.body;

    if (firstName !== undefined && typeof firstName !== "string") {
        throw new AppError(400, "First name must be a string");
    }

    if (lastName !== undefined && typeof lastName !== "string") {
        throw new AppError(400, "Last name must be a string");
    }

    if (phone !== undefined && typeof phone !== "string") {
        throw new AppError(400, "Phone must be a string");
    }

    if (address !== undefined && typeof address !== "string") {
        throw new AppError(400, "Address must be a string");
    }

    next();
};
