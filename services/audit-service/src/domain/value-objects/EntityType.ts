export enum EntityType {
    USER = 'USER',
    USER_PROFILE = 'USER_PROFILE',
    AUTH = 'AUTH',
    SYSTEM = 'SYSTEM',
    DOCUMENT = 'DOCUMENT',
    PROMPT = 'PROMPT',
}

export class EntityTypeVO {
    private constructor(private readonly value: EntityType) {}

    static create(entityType: string): EntityTypeVO {
        const validType = Object.values(EntityType).find(t => t === entityType);
        if (!validType) {
            throw new Error(`Invalid entity type: ${entityType}`);
        }
        return new EntityTypeVO(validType);
    }

    getValue(): EntityType {
        return this.value;
    }
}
