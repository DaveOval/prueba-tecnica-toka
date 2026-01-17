export interface ITokenService {
    generateAccessToken(userId: string, email: string): string;
    generateRefreshToken(userId: string): string;
    verifyToken(token: string): {  userId: string; email: string } | null
}