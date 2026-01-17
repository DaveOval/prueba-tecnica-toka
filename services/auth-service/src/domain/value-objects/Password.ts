import * as bcrypt from "bcrypt";

export class Password {
    private readonly hashedValue: string;

    private constructor(hashedValue: string) {
        this.hashedValue = hashedValue;
    }

    static async create(plainPassword: string) : Promise<Password> {
        if (plainPassword.length < 8) {
            throw new Error("Password must be at least 8 characters long");
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        return new Password(hashedPassword);
    }

    static fromHash(hashedValue: string): Password {
        return new Password(hashedValue);
    }

    async compare(plainPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, this.hashedValue);
    }

    getHashedValue() : string {
        return this.hashedValue;
    }
}