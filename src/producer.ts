// src/producer.ts
import { orderQueue } from "./queue.js";
import { v4 as uuidv4 } from "uuid";

export type CreateOrderPayload = {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  minAmountOut?: number | null;
  type?: string;
};

export type EnqueuedOrder = CreateOrderPayload & { id: string };

export async function enqueueOrder(payload: CreateOrderPayload): Promise<EnqueuedOrder> {
  const id = uuidv4().replace(/-/g, "");

  const order: EnqueuedOrder = {
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
