import { Email } from "../../domain/value-objects/Email.js";
import { Password } from "../../domain/value-objects/Password.js";
import { AuthDomainService } from "../../domain/services/AuthDomainService.js";
import type { IEventPublisher } from "../ports/IEventPublisher.js";
import type { RegisterUserDTO, RegisterUserResponseDTO } from "../dto/RegisterUserDTO.js";

export class RegisterUserUseCase { 
    constructor(
        private readonly authDomainService: AuthDomainService,
        private readonly eventPublisher: IEventPublisher
    ){}

    async execute(dto: RegisterUserDTO): Promise<RegisterUserResponseDTO> {
        const email = Email.create(dto.email);
        const password = await Password.create(dto.password);

        const user = await this.authDomainService.registerUser(email, password);

        // publish event
        await this.eventPublisher.publish("user.registered", {
            userId: user.getId(),
            email: user.getEmail().getValue(),
            timestamp: new Date().toISOString(),
        });

        return {
            id: user.getId(),
            email: user.getEmail().getValue(),
            createdAt: user.getCreatedAt(),
        }
    }
 }