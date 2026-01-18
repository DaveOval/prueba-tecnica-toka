import { User } from "../../domain/entities/User.js";
import { Email } from "../../domain/value-objects/Email.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { Database } from "../config/database.js";

export class PostgresUserRepository implements IUserRepository {
    private get prisma() {
        return Database.getClient();
    }

    async save(user: User): Promise<void> {
        await this.prisma.user.upsert({
          where: { id: user.getId() },
          update: {
            email: user.getEmail().getValue(),
            password: user.getPassword().getHashedValue(),
            role: user.getRole(),
            active: user.isActive(),
            updatedAt: user.getUpdatedAt(),
          },
          create: {
            id: user.getId(),
            email: user.getEmail().getValue(),
            password: user.getPassword().getHashedValue(),
            role: user.getRole(),
            active: user.isActive(),
            createdAt: user.getCreatedAt(),
            updatedAt: user.getUpdatedAt(),
          },
        });
      }

      async findByEmail(email: Email): Promise<User | null> {
        const userData = await this.prisma.user.findUnique({
            where: { email: email.getValue() },
        });

        if (!userData) {
            return null;
        }

        return User.reconstitute(
            userData.id,
            userData.email,
            userData.password,
            userData.role,
            userData.active,
            userData.createdAt,
            userData.updatedAt,
        )
      }

      async findById(id: string): Promise<User | null> {
        const userData = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!userData) {
            return null;
        }

        return User.reconstitute(
            userData.id,
            userData.email,
            userData.password,
            userData.role,
            userData.active,
            userData.createdAt,
            userData.updatedAt,
        )
      }

      async existByEmail(email: Email): Promise<boolean> {
        const count = await this.prisma.user.count({
            where: { email: email.getValue() },
        });

        return count > 0;
      }

      async findAll(): Promise<User[]> {
        const usersData = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return usersData.map(userData => 
            User.reconstitute(
                userData.id,
                userData.email,
                userData.password,
                userData.role,
                userData.active,
                userData.createdAt,
                userData.updatedAt,
            )
        );
      }

      async delete(id: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id },
        });
      }
}