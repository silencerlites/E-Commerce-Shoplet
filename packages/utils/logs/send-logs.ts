import { kafka } from "../kafka";

const producer = kafka.producer();
let isConnected = false;

// Connect producer once
const connectProducer = async () => {
  if (!isConnected) {
    await producer.connect();
    console.log("Kafka producer connected");
    isConnected = true;
  }
};

export async function sendLog({
  type = "info",
  message,
  source = "unknown-service",
}: {
  type?: "info" | "error" | "warning" | "success" | "debug";
  message: string;
  source?: string;
}) {
  await connectProducer();

  const logPayload = {
    type,
    message,
    timestamp: new Date().toISOString(),
    source,
  };

  try {
    await producer.send({
      topic: "logs",
      messages: [{ value: JSON.stringify(logPayload) }],
    });
    console.log("Log sent to Kafka:", logPayload);
  } catch (err) {
    console.error("Failed to send log:", err);
  }
};

// Optional: graceful shutdown
process.on("SIGINT", async () => {
  if (isConnected) {
    await producer.disconnect();
    console.log("Kafka producer disconnected");
  }
  process.exit(0);
});
