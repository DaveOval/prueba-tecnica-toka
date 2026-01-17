export class Email {
    private readonly value: string;

    private constructor(email: string) {
        if (!this.isValid(email)) {
            throw new Error("Invalid email format");
        }
        this.value = email.toLowerCase().trim();
    }

    static create(email: string): Email {
        return new Email(email);
    }

    private isValid(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: Email): boolean {
        return this.value === other.value;
    }
}
