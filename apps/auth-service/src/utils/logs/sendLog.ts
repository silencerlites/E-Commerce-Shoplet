export type LogType = "info" | "success" | "warning" | "error";

export interface LogData {
  type: LogType;
  message: string;
  source?: string;
  timestamp?: Date;
}

export function sendLog({ type, message, source, timestamp = new Date() }: LogData) {
  const logMessage = `[${type.toUpperCase()}] ${source ? `[${source}] ` : ""}${message} (${timestamp.toISOString()})`;
  console.log(logMessage);
}