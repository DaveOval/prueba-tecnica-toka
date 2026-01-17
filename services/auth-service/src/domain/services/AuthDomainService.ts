import { User } from "../entities/User.js";
import { Email } from "../value-objects/Email.js";
import { Password } from "../value-objects/Password.js";
import type { IUserRepository } from "../repositories/IUserRepository.js";

export class AuthDomainService {
    constructor(private readonly userRepository: IUserRepository) {}

    async registerUser(email: Email, password: Password): Promise<User> {
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error("User with this email already exists");
        }

        const newUserId = crypto.randomUUID();
        const newUser = User.create(newUserId, email, password);
        await this.userRepository.save(newUser);

        return newUser;
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

        return user;
    }
}