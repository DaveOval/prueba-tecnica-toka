import { User } from "../entities/User.js";
import { Email } from "../value-objects/Email.js";

export interface IUserRepository {
    save(user: User): Promise<void>;
    findByEmail(email: Email): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    existByEmail(email: Email): Promise<boolean>;
    findAll(): Promise<User[]>;
    delete(id: string): Promise<void>;
}