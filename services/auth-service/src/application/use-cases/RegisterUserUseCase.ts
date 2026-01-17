import { Email } from "../../domain/value-objects/Email.js";
import { Password } from "../../domain/value-objects/Password.js";
import { AuthDomainService } from "../../domain/services/AuthDomainService.js";
import { UserRole } from "../../domain/entities/User.js";
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
        
        // Validar y asignar role
        let role = UserRole.USER;
        if (dto.role) {
            if (dto.role === 'admin') {
                role = UserRole.ADMIN;
            } else if (dto.role !== 'user') {
                throw new Error('Invalid role. Must be "user" or "admin"');
            }
        }

        const user = await this.authDomainService.registerUser(email, password, role);

        // publish user.registered event
        await this.eventPublisher.publish("user.registered", {
            userId: user.getId(),
            email: user.getEmail().getValue(),
            timestamp: new Date().toISOString(),
        });

        // publish audit event
        await this.eventPublisher.publish("audit.event", {
            userId: user.getId(),
            action: "REGISTER",
            entityType: "AUTH",
            entityId: user.getId(),
            details: { email: user.getEmail().getValue() },
        });

        return {
            id: user.getId(),
            email: user.getEmail().getValue(),
            createdAt: user.getCreatedAt(),
        }
    }
 }