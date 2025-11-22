// src/websocketManager.ts
import type { WebSocket } from "ws";

const sockets = new Map<string, WebSocket>();

export function registerSocket(orderId: string, ws: WebSocket) {
  sockets.set(orderId, ws);
}

export function unregisterSocket(orderId: string) {
  sockets.delete(orderId);
}

export function sendStatus(orderId: string, payload: unknown) {
  const ws = sockets.get(orderId);
  if (!ws || ws.readyState !== ws.OPEN) return;

  try {
    ws.send(JSON.stringify(payload));
  } catch (err) {
    console.warn("WS send failed:", err);
  }
}
