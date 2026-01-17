export enum Action {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    READ = 'READ',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    REGISTER = 'REGISTER',
}

export class ActionVO {
    private constructor(private readonly value: Action) {}

    static create(action: string): ActionVO {
        const validAction = Object.values(Action).find(a => a === action);
        if (!validAction) {
            throw new Error(`Invalid action: ${action}`);
        }
        return new ActionVO(validAction);
    }

    getValue(): Action {
        return this.value;
    }
}
