import WebSocket from "ws";

// Single shared queue for logs
export const logQueue: string[] = [];

// Set of connected WebSocket clients
export const clients = new Set<WebSocket>();

// Broadcast logs every second
export const processLogs = () => {
  if (!logQueue.length) return;

  console.log(`Processing ${logQueue.length} logs in batch`);
  console.log("Connected WS clients:", clients.size);

  const logs = [...logQueue];
  logQueue.length = 0;

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      logs.forEach((log) => {
        console.log("Sending log to client:", log);
        client.send(log);
      });
    }
  });
};

// Start batch processor
setInterval(processLogs, 1000);
