import { Kafka } from "kafkajs";
import type { IEventPublisher } from "../../application/ports/IEventPublisher.js";

export class KafkaEventPublisher implements IEventPublisher {
    private producer: any;

    constructor() {
        const kafka = new Kafka({
            clientId: "user-service",
            brokers: (process.env.KAFKA_BROKER || "localhost:9092").split(","),
        });

        this.producer = kafka.producer();
    }

    async connect(): Promise<void> {
        await this.producer.connect();
    }

    async disconnect(): Promise<void> {
        await this.producer.disconnect();
    }

    async publish(eventName: string, payload: Record<string, unknown>): Promise<void> {
        try {
            await this.producer.send({
                topic: eventName,
                messages: [
                    {
                        key: (payload.userId as string) || (payload.entityId as string) || "unknown",
                        value: JSON.stringify({
                            ...payload,
                            eventType: eventName,
                            timestamp: new Date().toISOString(),
                        }),
                    },
                ],
            });
        } catch (error) {
            console.error("Error publishing event:", error);
            throw error;
        }
    }
}
