import type { Request, Response, NextFunction } from 'express';
import { CreateUserProfileUseCase } from '../../application/use-cases/CreateUserProfileUseCase.js';
import { GetUserProfileUseCase } from '../../application/use-cases/GetUserProfileUseCase.js';
import { UpdateUserProfileUseCase } from '../../application/use-cases/UpdateUserProfileUseCase.js';
import { GetAllUsersUseCase } from '../../application/use-cases/GetAllUsersUseCase.js';
import { DeleteUserProfileUseCase } from '../../application/use-cases/DeleteUserProfileUseCase.js';
import type { CreateUserProfileDTO } from '../../application/dto/CreateUserProfileDTO.js';
import type { UpdateUserProfileDTO } from '../../application/dto/UpdateUserProfileDTO.js';
import { AppError } from '../middlewares/errorHandler.js';

export class UserController {
  constructor(
    private readonly createUserProfileUseCase: CreateUserProfileUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly deleteUserProfileUseCase: DeleteUserProfileUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: CreateUserProfileDTO = {
        id: req.body.id,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        address: req.body.address,
      };

      const result = await this.createUserProfileUseCase.execute(dto);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User profile with this email already exists') {
          next(new AppError(409, error.message));
          return;
        }
        if (error.message === 'Invalid email format') {
          next(new AppError(400, error.message));
          return;
        }
      }
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.getUserProfileUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User profile not found') {
          next(new AppError(404, error.message));
          return;
        }
      }
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateUserProfileDTO = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        address: req.body.address,
      };

      const result = await this.updateUserProfileUseCase.execute(id, dto);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User profile not found') {
          next(new AppError(404, error.message));
          return;
        }
      }
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      await this.deleteUserProfileUseCase.execute(id);

      res.status(200).json({
        success: true,
        message: 'User profile deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User profile not found') {
          next(new AppError(404, error.message));
          return;
        }
      }
      next(error);
    }
  };
}
