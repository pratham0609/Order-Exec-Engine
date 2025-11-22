export type OrderType = 'market';
export type OrderStatus = 'pending'|'routing'|'building'|'submitted'|'confirmed'|'failed';

export interface Order {
  id: string;
  userId?: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  minAmountOut?: number; // slippage protection
  createdAt: string;
  type: OrderType;
}
