import { Kafka } from "kafkajs";
import type { IEventConsumer } from "../../application/ports/IEventConsumer.js";
import logger from '../config/logger.js';

export class KafkaEventConsumer implements IEventConsumer {
    private consumer: any;
    private isRunning: boolean = false;

    constructor() {
        const kafka = new Kafka({
            clientId: "audit-service",
            brokers: (process.env.KAFKA_BROKER || "localhost:9092").split(","),
        });

        this.consumer = kafka.consumer({ groupId: "audit-service-group" });
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        await this.consumer.connect();
        this.isRunning = true;
        logger.info({ message: 'Kafka consumer connected' });
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        await this.consumer.disconnect();
        this.isRunning = false;
        logger.info({ message: 'Kafka consumer disconnected' });
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
                    logger.error({ 
                        message: 'Error processing message from topic',
                        topic,
                        error: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined
                    });
                }
            },
        });

        logger.info({ 
            message: 'Subscribed to topic',
            topic 
        });
    }
}
