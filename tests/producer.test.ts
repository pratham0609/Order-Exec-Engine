jest.mock('../src/queue', () => ({
  orderQueue: { add: jest.fn().mockResolvedValue(true) }
}));

import { enqueueOrder } from '../src/producer';

describe('producer.enqueueOrder', () => {
  test('enqueues job and returns id and payload', async () => {
    const payload = { tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 2 };
    const res = await enqueueOrder(payload);
    expect(res).toHaveProperty('id');
    expect(res.tokenIn).toBe('SOL');
    expect(res.amountIn).toBe(2);
  });
});
