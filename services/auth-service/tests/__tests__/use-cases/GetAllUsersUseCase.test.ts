import { GetAllUsersUseCase } from '../../../src/application/use-cases/GetAllUsersUseCase.js';
import { User, UserRole } from '../../../src/domain/entities/User.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import { Password } from '../../../src/domain/value-objects/Password.js';
import type { IUserRepository } from '../../../src/domain/repositories/IUserRepository.js';

describe('GetAllUsersUseCase', () => {
  let getAllUsersUseCase: GetAllUsersUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      existByEmail: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as any;

    getAllUsersUseCase = new GetAllUsersUseCase(mockUserRepository);
  });

  it('should return all users', async () => {
    const user1 = User.create('user-1', Email.create('user1@example.com'), Password.fromHash('hash1'), UserRole.USER, true);
    const user2 = User.create('user-2', Email.create('user2@example.com'), Password.fromHash('hash2'), UserRole.ADMIN, true);
    
    mockUserRepository.findAll.mockResolvedValue([user1, user2]);

    const result = await getAllUsersUseCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'user-1',
      email: 'user1@example.com',
      role: 'user',
      active: true,
    });
    expect(result[1]).toMatchObject({
      id: 'user-2',
      email: 'user2@example.com',
      role: 'admin',
      active: true,
    });
    expect(mockUserRepository.findAll).toHaveBeenCalled();
  });

  it('should return empty array when no users exist', async () => {
    mockUserRepository.findAll.mockResolvedValue([]);

    const result = await getAllUsersUseCase.execute();

    expect(result).toEqual([]);
  });
});
