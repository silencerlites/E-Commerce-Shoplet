"use client";

import React, { useEffect, useRef, useState } from "react";
import BreadCrumbs from "../../shared/components/breadcrumbs";
import { Download } from "lucide-react";

type LogType = "info" | "success" | "warning" | "error";

type LogItem = {
  type: LogType;
  message: string;
  timestamp: string;
  source?: string;
};

const typeColorMap: Record<LogType, string> = {
  success: "text-green-400",
  error: "text-red-500",
  warning: "text-yellow-300",
  info: "text-blue-300",
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogItem[]>([]);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // WebSocket connection
  useEffect(() => {
    const socket = new WebSocket(process.env.NEXT_PUBLIC_SOCKET_URI!);

    socket.onopen = () => console.log("WebSocket connected");
    socket.onmessage = (event) => {
      try {
        const parsed: LogItem = JSON.parse(event.data);
        setLogs((prev) => [...prev, parsed]);
      } catch {
        console.warn("Invalid log:", event.data);
      }
    };

    socket.onclose = () => console.log("WebSocket disconnected");

    return () => socket.close();
  }, []);

  // Update filtered logs whenever logs change
  useEffect(() => {
    setFilteredLogs(logs);

    // Auto-scroll to bottom
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Keyboard filter: 1-success, 2-error, 3-warning, 4-info, 0-all
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "1":
          setFilteredLogs(logs.filter((log) => log.type === "success"));
          break;
        case "2":
          setFilteredLogs(logs.filter((log) => log.type === "error"));
          break;
        case "3":
          setFilteredLogs(logs.filter((log) => log.type === "warning"));
          break;
        case "4":
          setFilteredLogs(logs.filter((log) => log.type === "info"));
          break;
        case "0":
          setFilteredLogs(logs);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [logs]);

  // Download logs as a .log file
  const downloadLogs = () => {
    const content = filteredLogs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toLocaleTimeString()} - ${
            log.source
          }: [${log.type.toUpperCase()}] - ${log.message}]`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "application-logs.log";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-h-screen p-8 bg-black text-white font-mono text-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold tracking-wide">Admin Logs</h2>
        <button
          onClick={downloadLogs}
          className="text-xs px-3 flex items-center justify-center gap-1 py-2 bg-gray-800"
        >
          <Download size={18} /> Download Logs
        </button>
      </div>

      {/* Breadcrumbs */}
      <div className="mb-4">
        <BreadCrumbs title="Admin Logs" />
      </div>

      {/* Log container */}
      <div
        ref={logContainerRef}
        className="bg-black border border-gray-800 rounded-md p-4 h-[600px] overflow-y-auto space-y-1"
      >
        {filteredLogs.length === 0 ? (
          <p className="text-gray-500">Waiting for logs …</p>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap">
              <span className="text-gray-500">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>{" "}
              <span className="text-purple-400">{log.source}</span>{" "}
              <span className={typeColorMap[log.type]}>
                [{log.type.toUpperCase()}]
              </span>{" "}
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
