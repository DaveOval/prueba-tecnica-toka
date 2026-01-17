import { Email } from "../value-objects/Email.js";

export class UserProfile {
    private constructor(
        private readonly id: string,
        private readonly email: Email,
        private firstName: string | null,
        private lastName: string | null,
        private phone: string | null,
        private address: string | null,
        private readonly createdAt: Date,
        private updatedAt: Date,
    ) {}

    static create(
        id: string,
        email: Email,
        firstName?: string,
        lastName?: string,
        phone?: string,
        address?: string
    ): UserProfile {
        const now = new Date();
        return new UserProfile(
            id,
            email,
            firstName || null,
            lastName || null,
            phone || null,
            address || null,
            now,
            now
        );
    }

    static reconstitute(
        id: string,
        email: string,
        firstName: string | null,
        lastName: string | null,
        phone: string | null,
        address: string | null,
        createdAt: Date,
        updatedAt: Date,
    ): UserProfile {
        return new UserProfile(
            id,
            Email.create(email),
            firstName,
            lastName,
            phone,
            address,
            createdAt,
            updatedAt,
        );
    }

    getId(): string {
        return this.id;
    }

    getEmail(): Email {
        return this.email;
    }

    getFirstName(): string | null {
        return this.firstName;
    }

    getLastName(): string | null {
        return this.lastName;
    }

    getPhone(): string | null {
        return this.phone;
    }

    getAddress(): string | null {
        return this.address;
    }

    updateProfile(data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        address?: string;
    }): void {
        if (data.firstName !== undefined) {
            this.firstName = data.firstName || null;
        }
        if (data.lastName !== undefined) {
            this.lastName = data.lastName || null;
        }
        if (data.phone !== undefined) {
            this.phone = data.phone || null;
        }
        if (data.address !== undefined) {
            this.address = data.address || null;
        }
        this.updatedAt = new Date();
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }
}
