import { Email } from "../value-objects/Email.js";
import { Password } from "../value-objects/Password.js";


export enum UserRole {
    USER = "user",
    ADMIN = "admin"
}

export class User {
    private constructor(
        private readonly id: string,
        private readonly email: Email,
        private password: Password,
        private readonly role: UserRole,
        private readonly createdAt: Date,
        private updatedAt: Date,
    ){}

    static create(id: string, email: Email, password: Password, role: UserRole = UserRole.USER): User {
        const now = new Date();
        return new User(id, email, password, role, now, now);
    }

    static reconstitute(
        id: string,
        email: string,
        hashedPassword: string,
        role: string,
        createdAt: Date,
        updatedAt: Date,
    ): User {
        return new User(
            id,
            Email.create(email),
            Password.fromHash(hashedPassword),
            role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.USER,
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

    getPassword(): Password {
        return this.password;
    }

    async changePassword(newPassword: Password): Promise<void> {
        this.password = newPassword;
        this.updatedAt = new Date();
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }

    getRole(): UserRole {
        return this.role;
    }

    isAdmin(): boolean {
        return this.role === UserRole.ADMIN;
    }
}