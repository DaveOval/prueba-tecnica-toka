import { JwtTokenService } from '../../../src/infrastructure/service/JwtTokenService.js';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('JwtTokenService', () => {
  let tokenService: JwtTokenService;
  const mockJwt = jwt as jest.Mocked<typeof jwt>;

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    
    jest.clearAllMocks();
    tokenService = new JwtTokenService();
  });

  afterEach(() => {
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    delete process.env.JWT_REFRESH_EXPIRES_IN;
  });

  describe('generateAccessToken', () => {
    it('should generate an access token', () => {
      const mockToken = 'mock-access-token';
      mockJwt.sign.mockReturnValue(mockToken as never);

      const token = tokenService.generateAccessToken('user-123', 'test@example.com', 'user');

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123', email: 'test@example.com', role: 'user', type: 'access' },
        'test-access-secret',
        { expiresIn: '15m' }
      );
      expect(token).toBe(mockToken);
    });

    it('should use default secret if not provided', () => {
      delete process.env.JWT_ACCESS_SECRET;
      const newService = new JwtTokenService();
      const mockToken = 'mock-token';
      mockJwt.sign.mockReturnValue(mockToken as never);

      newService.generateAccessToken('user-123', 'test@example.com', 'user');

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'access-secret',
        expect.any(Object)
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const mockToken = 'mock-refresh-token';
      mockJwt.sign.mockReturnValue(mockToken as never);

      const token = tokenService.generateRefreshToken('user-123');

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123', type: 'refresh' },
        'test-refresh-secret',
        { expiresIn: '7d' }
      );
      expect(token).toBe(mockToken);
    });

    it('should use default secret if not provided', () => {
      delete process.env.JWT_REFRESH_SECRET;
      const newService = new JwtTokenService();
      const mockToken = 'mock-token';
      mockJwt.sign.mockReturnValue(mockToken as never);

      newService.generateRefreshToken('user-123');

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'refresh-secret',
        expect.any(Object)
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };
      mockJwt.verify.mockReturnValue(mockDecoded as never);

      const result = tokenService.verifyToken('valid-token');

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-access-secret');
      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user',
      });
    });

    it('should return null for invalid token', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = tokenService.verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = tokenService.verifyToken('expired-token');

      expect(result).toBeNull();
    });

    it('should default role to user if not provided', () => {
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com',
      };
      mockJwt.verify.mockReturnValue(mockDecoded as never);

      const result = tokenService.verifyToken('valid-token');

      expect(result?.role).toBe('user');
    });
  });
});
