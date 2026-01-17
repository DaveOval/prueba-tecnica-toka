import { UserProfile } from "../../domain/entities/UserProfile.js";
import { Email } from "../../domain/value-objects/Email.js";
import type { IUserProfileRepository } from "../../domain/repositories/IUserProfileRepository.js";
import { Database } from "../config/database.js";

export class PostgresUserProfileRepository implements IUserProfileRepository {
    private get prisma() {
        return Database.getClient();
    }

    async save(profile: UserProfile): Promise<void> {
        await this.prisma.userProfile.upsert({
            where: { id: profile.getId() },
            update: {
                email: profile.getEmail().getValue(),
                firstName: profile.getFirstName(),
                lastName: profile.getLastName(),
                phone: profile.getPhone(),
                address: profile.getAddress(),
                updatedAt: profile.getUpdatedAt(),
            },
            create: {
                id: profile.getId(),
                email: profile.getEmail().getValue(),
                firstName: profile.getFirstName(),
                lastName: profile.getLastName(),
                phone: profile.getPhone(),
                address: profile.getAddress(),
                createdAt: profile.getCreatedAt(),
                updatedAt: profile.getUpdatedAt(),
            },
        });
    }

    async findById(id: string): Promise<UserProfile | null> {
        const profileData = await this.prisma.userProfile.findUnique({
            where: { id },
        });

        if (!profileData) {
            return null;
        }

        return UserProfile.reconstitute(
            profileData.id,
            profileData.email,
            profileData.firstName,
            profileData.lastName,
            profileData.phone,
            profileData.address,
            profileData.createdAt,
            profileData.updatedAt,
        );
    }

    async findByEmail(email: Email): Promise<UserProfile | null> {
        const profileData = await this.prisma.userProfile.findUnique({
            where: { email: email.getValue() },
        });

        if (!profileData) {
            return null;
        }

        return UserProfile.reconstitute(
            profileData.id,
            profileData.email,
            profileData.firstName,
            profileData.lastName,
            profileData.phone,
            profileData.address,
            profileData.createdAt,
            profileData.updatedAt,
        );
    }

    async findAll(): Promise<UserProfile[]> {
        const profilesData = await this.prisma.userProfile.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return profilesData.map(data =>
            UserProfile.reconstitute(
                data.id,
                data.email,
                data.firstName,
                data.lastName,
                data.phone,
                data.address,
                data.createdAt,
                data.updatedAt,
            )
        );
    }

    async delete(id: string): Promise<void> {
        await this.prisma.userProfile.delete({
            where: { id },
        });
    }
}
