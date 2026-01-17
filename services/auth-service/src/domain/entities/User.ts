import { Email } from "../value-objects/Email.js";
import { Password } from "../value-objects/Password.js";


export class User {
    private constructor(
        private readonly id: string,
        private readonly email: Email,
        private password: Password,
        private readonly createdAt: Date,
        private updatedAt: Date,
    ){}

    static create(id: string, email: Email, password: Password): User {
        const now = new Date();
        return new User(id, email, password, now, now);
    }

    static reconstitute(
        id: string,
        email: string,
        hashedPassword: string,
        createdAt: Date,
        updatedAt: Date,
    ): User {
        return new User(
            id,
            Email.create(email),
            Password.fromHash(hashedPassword),
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
}