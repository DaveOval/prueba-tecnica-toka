import type { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase.js';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase.js';
import type { RegisterUserDTO } from '../../application/dto/RegisterUserDTO.js';
import type { LoginDTO } from '../../application/dto/LoginDTO.js';
import { AppError } from '../middlewares/errorHandler.js';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: RegisterUserDTO = {
        email: req.body.email,
        password: req.body.password,
      };

      const result = await this.registerUserUseCase.execute(dto);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User with this email already exists') {
          next(new AppError(409, error.message));
          return;
        }
        if (error.message === 'Invalid email format') {
          next(new AppError(400, error.message));
          return;
        }
        if (error.message === 'Password must be at least 8 characters long') {
          next(new AppError(400, error.message));
          return;
        }
      }
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: LoginDTO = {
        email: req.body.email,
        password: req.body.password,
      };

      const result = await this.loginUseCase.execute(dto);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid credentials') {
          next(new AppError(401, error.message));
          return;
        }
      }
      next(error);
    }
  };
}