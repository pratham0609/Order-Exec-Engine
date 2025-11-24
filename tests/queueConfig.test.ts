import { orderQueue } from '../src/queue';

describe('queue configuration', () => {
  test('orderQueue exists and has add function', () => {
    expect(orderQueue).toBeDefined();
    expect(typeof orderQueue.add).toBe('function');
  });
});
