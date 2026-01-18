import type { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase.js';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase.js';
import { ActivateUserUseCase } from '../../application/use-cases/ActivateUserUseCase.js';
import { GetAllUsersUseCase } from '../../application/use-cases/GetAllUsersUseCase.js';
import type { RegisterUserDTO } from '../../application/dto/RegisterUserDTO.js';
import type { LoginDTO } from '../../application/dto/LoginDTO.js';
import { AppError } from '../middlewares/errorHandler.js';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly activateUserUseCase: ActivateUserUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase
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
        if (error.message.includes('not active')) {
          next(new AppError(403, error.message));
          return;
        }
      }
      next(error);
    }
  };

  activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      await this.activateUserUseCase.execute(userId);

      res.status(200).json({
        success: true,
        message: 'User activated successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          next(new AppError(404, error.message));
          return;
        }
      }
      next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getAllUsersUseCase.execute();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}