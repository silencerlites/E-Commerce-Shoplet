import http from "http";
import WebSocket from "ws";
import { clients } from "./log-queue";
import { startKafkaConsumer } from "./logger-consumer";
import { sendLog } from "@packages/utils/logs/send-logs";

const server = http.createServer();
const wsServer = new WebSocket.Server({ noServer: true });

// WebSocket connection handler
wsServer.on("connection", (ws) => {
  clients.add(ws);
  console.log("New logger client connected, total clients:", clients.size);

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Logger client disconnected, total clients:", clients.size);
  });
});

// Handle HTTP upgrade for WebSocket
server.on("upgrade", (req, socket, head) => {
  wsServer.handleUpgrade(req, socket, head, (ws) =>
    wsServer.emit("connection", ws, req)
  );
});

server.listen(process.env.PORT || 6008, async () => {
  console.log(`Listening at http://localhost:6008/api`);
});



// Start Kafka consumer
startKafkaConsumer().catch(console.error);
