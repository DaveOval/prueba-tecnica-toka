import { UserProfile } from "../entities/UserProfile.js";
import { Email } from "../value-objects/Email.js";
import type { IUserProfileRepository } from "../repositories/IUserProfileRepository.js";

export class UserDomainService {
    constructor(private readonly userProfileRepository: IUserProfileRepository) {}

    async createProfile(
        id: string,
        email: Email,
        firstName?: string,
        lastName?: string,
        phone?: string,
        address?: string
    ): Promise<UserProfile> {
        const existingProfile = await this.userProfileRepository.findByEmail(email);
        if (existingProfile) {
            throw new Error("User profile with this email already exists");
        }

        const profile = UserProfile.create(id, email, firstName, lastName, phone, address);
        await this.userProfileRepository.save(profile);

        return profile;
    }

    async updateProfile(
        id: string,
        data: {
            firstName?: string;
            lastName?: string;
            phone?: string;
            address?: string;
        }
    ): Promise<UserProfile> {
        const profile = await this.userProfileRepository.findById(id);
        if (!profile) {
            throw new Error("User profile not found");
        }

        profile.updateProfile(data);
        await this.userProfileRepository.save(profile);

        return profile;
    }

    async getProfile(id: string): Promise<UserProfile> {
        const profile = await this.userProfileRepository.findById(id);
        if (!profile) {
            throw new Error("User profile not found");
        }

        return profile;
    }

    async getAllProfiles(): Promise<UserProfile[]> {
        return await this.userProfileRepository.findAll();
    }

    async deleteProfile(id: string): Promise<void> {
        const profile = await this.userProfileRepository.findById(id);
        if (!profile) {
            throw new Error("User profile not found");
        }

        await this.userProfileRepository.delete(id);
    }
}
