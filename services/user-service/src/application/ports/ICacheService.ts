export interface ICacheService {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
    deletePattern(pattern: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    clear(): Promise<void>;
}
