import { Kafka } from "kafkajs";
import type { IEventConsumer } from "../../application/ports/IEventConsumer.js";

export class KafkaEventConsumer implements IEventConsumer {
    private consumer: any;
    private isRunning: boolean = false;

    constructor() {
        const kafka = new Kafka({
            clientId: "user-service",
            brokers: (process.env.KAFKA_BROKER || "localhost:9092").split(","),
        });

        this.consumer = kafka.consumer({ groupId: "user-service-group" });
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        await this.consumer.connect();
        this.isRunning = true;
        console.log("Kafka consumer connected");
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        await this.consumer.disconnect();
        this.isRunning = false;
        console.log("Kafka consumer disconnected");
    }

    async subscribe(topic: string, handler: (message: any) => Promise<void>): Promise<void> {
        if (!this.isRunning) {
            await this.start();
        }

        await this.consumer.subscribe({ topic, fromBeginning: false });

        await this.consumer.run({
            eachMessage: async ({ message }: any) => {
                try {
                    const value = message.value?.toString();
                    if (value) {
                        const payload = JSON.parse(value);
                        await handler(payload);
                    }
                } catch (error) {
                    console.error(`Error processing message from topic ${topic}:`, error);
                }
            },
        });

        console.log(`Subscribed to topic: ${topic}`);
    }
}
