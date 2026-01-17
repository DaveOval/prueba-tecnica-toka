import { UserProfile } from "../entities/UserProfile.js";
import { Email } from "../value-objects/Email.js";

export interface IUserProfileRepository {
    save(profile: UserProfile): Promise<void>;
    findById(id: string): Promise<UserProfile | null>;
    findByEmail(email: Email): Promise<UserProfile | null>;
    findAll(): Promise<UserProfile[]>;
    delete(id: string): Promise<void>;
}
