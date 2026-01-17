export interface ITokenService {
    generateAccessToken(userId: string, email: string, role: string): string;
    generateRefreshToken(userId: string): string;
    verifyToken(token: string): {  userId: string; email: string; role: string } | null
}