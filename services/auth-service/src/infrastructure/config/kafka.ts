import { KafkaEventPublisher } from "../messaging/KafkaEventPublisher.js";

let kafkaPublisher: KafkaEventPublisher | null = null;

export async function initializeKafka(): Promise<KafkaEventPublisher> {
    if (!kafkaPublisher) {
        kafkaPublisher = new KafkaEventPublisher();
        await kafkaPublisher.connect();
    }
    return kafkaPublisher;
}

export async function closeKafka(): Promise<void> {
    if (kafkaPublisher) {
        await kafkaPublisher.disconnect();
        kafkaPublisher = null;
    }
}

export async function getKafkaPublisher(): Promise<KafkaEventPublisher> {
    if (!kafkaPublisher) {
        throw new Error("Kafka publisher not initialized");
    }
    return kafkaPublisher;
}