import { UserDomainService } from "../../domain/services/UserDomainService.js";

export class DeleteUserProfileUseCase {
    constructor(
        private readonly userDomainService: UserDomainService
    ) {}

    async execute(userId: string): Promise<void> {
        await this.userDomainService.deleteProfile(userId);
    }
}
