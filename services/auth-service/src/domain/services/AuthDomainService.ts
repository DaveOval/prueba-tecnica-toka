import { User, UserRole } from "../entities/User.js";
import { Email } from "../value-objects/Email.js";
import { Password } from "../value-objects/Password.js";
import type { IUserRepository } from "../repositories/IUserRepository.js";

export class AuthDomainService {
    constructor(private readonly userRepository: IUserRepository) {}

    async registerUser(email: Email, password: Password, role: UserRole = UserRole.USER, active: boolean = false): Promise<User> {
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error("User with this email already exists");
        }

        const newUserId = crypto.randomUUID();
        const newUser = User.create(newUserId, email, password, role, active);
        await this.userRepository.save(newUser);

        return newUser;
    }

    async activateUser(userId: string): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        user.activate();
        await this.userRepository.save(user);

        return user;
    }

    async deactivateUser(userId: string): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        user.deactivate();
        await this.userRepository.save(user);

        return user;
    }

    async changeUserRole(userId: string, newRole: UserRole): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Crear un nuevo User con el rol actualizado
        // El método save() actualizará el role en la base de datos
        const updatedUser = User.reconstitute(
            user.getId(),
            user.getEmail().getValue(),
            user.getPassword().getHashedValue(),
            newRole === UserRole.ADMIN ? UserRole.ADMIN : UserRole.USER,
            user.isActive(),
            user.getCreatedAt(),
            new Date(),
        );

        await this.userRepository.save(updatedUser);

        return updatedUser;
    }

    async authenticateUser(email: Email, plainPassword: string): Promise<User> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isValidPassword = await user.getPassword().compare(plainPassword);
        if (!isValidPassword) {
            throw new Error("Invalid credentials");
        }

        // Verificar que el usuario esté activo
        if (!user.isActive()) {
            throw new Error("User account is not active. Please wait for admin approval.");
        }

        return user;
    }
}