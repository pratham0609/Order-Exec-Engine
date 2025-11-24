// src/producer.ts
import { orderQueue } from "./queue.js";
import { v4 as uuidv4 } from "uuid";
export async function enqueueOrder(payload) {
    const id = uuidv4().replace(/-/g, "");
    const order = {
        id,
        tokenIn: payload.tokenIn,
        tokenOut: payload.tokenOut,
        amountIn: payload.amountIn,
        minAmountOut: payload.minAmountOut ?? null,
        type: payload.type ?? "market",
    };
    await orderQueue.add("processOrder", order);
    return order;
}
