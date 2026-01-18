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
        private active: boolean,
        private readonly createdAt: Date,
        private updatedAt: Date,
    ){}

    static create(id: string, email: Email, password: Password, role: UserRole = UserRole.USER, active: boolean = false): User {
        const now = new Date();
        // Los admins se crean activos por defecto
        const isActive = role === UserRole.ADMIN ? true : active;
        return new User(id, email, password, role, isActive, now, now);
    }

    static reconstitute(
        id: string,
        email: string,
        hashedPassword: string,
        role: string,
        active: boolean,
        createdAt: Date,
        updatedAt: Date,
    ): User {
        return new User(
            id,
            Email.create(email),
            Password.fromHash(hashedPassword),
            role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.USER,
            active,
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

    isActive(): boolean {
        return this.active;
    }

    activate(): void {
        this.active = true;
        this.updatedAt = new Date();
    }

    deactivate(): void {
        this.active = false;
        this.updatedAt = new Date();
    }
}