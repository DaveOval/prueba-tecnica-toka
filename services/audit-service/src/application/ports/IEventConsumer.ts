export interface IEventConsumer {
    subscribe(topic: string, handler: (message: any) => Promise<void>): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
