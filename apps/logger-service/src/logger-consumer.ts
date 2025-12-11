import { kafka } from "@packages/utils/kafka";
import { logQueue } from "./log-queue";

const consumer = kafka.consumer({ groupId: "log-events-group" });

export const startKafkaConsumer = async () => {
  try {
    await consumer.connect();
    console.log("Kafka consumer connected");

    await consumer.subscribe({ topic: "logs", fromBeginning: true });
    console.log("Subscribed to topic 'logs'");

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        const log = message.value.toString();
        console.log("[Kafka] Message received:", log);

        logQueue.push(log); // add to shared queue
      },
    });
  } catch (error) {
    console.error("Kafka consumer error:", error);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await consumer.disconnect();
  console.log("Kafka consumer disconnected");
  process.exit(0);
});
