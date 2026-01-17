import { Email } from "../../domain/value-objects/Email.js";
import { AuthDomainService } from "../../domain/services/AuthDomainService.js";
import type { ITokenService } from "../ports/ITokenService.js";
import type { IEventPublisher } from '../ports/IEventPublisher.js';
import type { LoginDTO, LoginResponseDTO } from "../dto/LoginDTO.js";

export class LoginUseCase {
    constructor(
        private readonly authDomainService: AuthDomainService,
        private readonly tokenService: ITokenService,
        private readonly eventPublisher: IEventPublisher
    ){}

    async execute(dto: LoginDTO): Promise<LoginResponseDTO> {
        const email = Email.create(dto.email);

        const user = await this.authDomainService.authenticateUser(email, dto.password );

        // Generate tokens
        const accessToken = this.tokenService.generateAccessToken(
            user.getId(),
            user.getEmail().getValue(),
            user.getRole()
        )
        const refreshToken = this.tokenService.generateRefreshToken(user.getId());

        // publish user.loggedIn event
        await this.eventPublisher.publish("user.loggedIn", {
            userId: user.getId(),
            email: user.getEmail().getValue(),
            timestamp: new Date().toISOString(),
        });

        // publish audit event
        await this.eventPublisher.publish("audit.event", {
            userId: user.getId(),
            action: "LOGIN",
            entityType: "AUTH",
            entityId: user.getId(),
            details: { email: user.getEmail().getValue() },
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.getId(),
                email: user.getEmail().getValue(),
            },
        }
    }
}