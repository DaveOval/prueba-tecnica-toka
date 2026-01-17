import { KafkaEventConsumer } from "../messaging/KafkaEventConsumer.js";

let kafkaConsumer: KafkaEventConsumer | null = null;

export async function initializeKafka(): Promise<KafkaEventConsumer> {
    if (!kafkaConsumer) {
        kafkaConsumer = new KafkaEventConsumer();
        await kafkaConsumer.start();
    }
    return kafkaConsumer;
}

export async function closeKafka(): Promise<void> {
    if (kafkaConsumer) {
        await kafkaConsumer.stop();
        kafkaConsumer = null;
    }
}

export async function getKafkaConsumer(): Promise<KafkaEventConsumer> {
    if (!kafkaConsumer) {
        throw new Error("Kafka consumer not initialized");
    }
    return kafkaConsumer;
}
