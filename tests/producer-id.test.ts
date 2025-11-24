import { enqueueOrder } from '../src/producer';
import { orderQueue } from '../src/queue';

jest.mock('../src/queue', () => ({
  orderQueue: { add: jest.fn().mockResolvedValue(true) }
}));

describe('producer id format', () => {
  test('generate id with 32+ hex chars', async () => {
    const res = await enqueueOrder({ tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 1 });
    expect(typeof res.id).toBe('string');
    expect(res.id.length).toBeGreaterThanOrEqual(32);
  });
});
