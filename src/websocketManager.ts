// src/websocketManager.ts
import type { WebSocket } from "ws";

const sockets = new Map<string, WebSocket>();

export function registerSocket(orderId: string, ws: WebSocket) {
  console.log(`[WS] registerSocket -> orderId=${orderId}, readyState=${(ws as any).readyState}`);
  sockets.set(orderId, ws);
}

export function unregisterSocket(orderId: string) {
  console.log(`[WS] unregisterSocket -> orderId=${orderId}`);
  sockets.delete(orderId);
}

function safeSend(ws: WebSocket, payload: any) {
  try {
    if (!ws || (ws as any).readyState !== (ws as any).OPEN) {
      console.warn(`[WS] safeSend: socket not open (readyState=${(ws as any).readyState})`);
      return false;
    }
    ws.send(JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error("[WS] safeSend error:", err);
    return false;
  }
}

/**
 * Send payload to the socket registered for orderId (if present).
 * This is server-only helper (worker no longer calls this).
 */
export function sendStatus(orderId: string, payload: any) {
  const ws = sockets.get(orderId);
  if (!ws) {
    console.debug(`[WS] sendStatus: no socket for ${orderId}, skipping`);
    return false;
  }
  return safeSend(ws, payload);
}
