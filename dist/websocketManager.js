const sockets = new Map();
export function registerSocket(orderId, ws) {
    console.log(`[WS] registerSocket -> orderId=${orderId}, readyState=${ws.readyState}`);
    sockets.set(orderId, ws);
}
export function unregisterSocket(orderId) {
    console.log(`[WS] unregisterSocket -> orderId=${orderId}`);
    sockets.delete(orderId);
}
function safeSend(ws, payload) {
    try {
        if (!ws || ws.readyState !== ws.OPEN) {
            console.warn(`[WS] safeSend: socket not open (readyState=${ws.readyState})`);
            return false;
        }
        ws.send(JSON.stringify(payload));
        return true;
    }
    catch (err) {
        console.error("[WS] safeSend error:", err);
        return false;
    }
}
/**
 * Send payload to the socket registered for orderId (if present).
 * This is server-only helper (worker no longer calls this).
 */
export function sendStatus(orderId, payload) {
    const ws = sockets.get(orderId);
    if (!ws) {
        console.debug(`[WS] sendStatus: no socket for ${orderId}, skipping`);
        return false;
    }
    return safeSend(ws, payload);
}
