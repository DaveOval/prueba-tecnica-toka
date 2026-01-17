import jwt, { type SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type { ITokenService } from "../../application/ports/ITokenService.js";

export class JwtTokenService implements ITokenService {
    private readonly accessTokenSecret: string;
    private readonly refreshTokenSecret: string;
    private readonly accessTokenExpiresIn: string;
    private readonly refreshTokenExpiresIn: string;

    constructor() {
        this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || "access-secret";
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || "refresh-secret";
        this.accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
        this.refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
    }

    generateAccessToken(userId: string, email: string): string {
        const options: SignOptions = { expiresIn: this.accessTokenExpiresIn as StringValue };
        return jwt.sign(
            { userId, email, type: "access" },
            this.accessTokenSecret,
            options,
        );
    }

    generateRefreshToken(userId: string): string {
        const options: SignOptions = { expiresIn: this.refreshTokenExpiresIn as StringValue };
        return jwt.sign(
            { userId, type: "refresh" },
            this.refreshTokenSecret,
            options,
        );
    }

    verifyToken(token: string): { userId: string; email: string } | null {
        try {
            const decoded = jwt.verify(token, this.accessTokenSecret) as {
                userId: string;
                email: string;
            };
            return { userId: decoded.userId, email: decoded.email };
        } catch (error) {
            console.error("Error verifying token:", error);
            return null;
        }
    }
}