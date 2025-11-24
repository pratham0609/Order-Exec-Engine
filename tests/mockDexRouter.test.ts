import { MockDexRouter } from '../src/mockDexRouter';

describe('MockDexRouter', () => {
  const router = new MockDexRouter();

  test('getRaydiumQuote returns expected shape and price range', async () => {
    const q = await router.getRaydiumQuote('SOL', 'USDC', 5);
    expect(q).toHaveProperty('dex', 'raydium');
    expect(typeof q.price).toBe('number');
    expect(q.price).toBeGreaterThan(0.9); // base price ~1 +/- variance
    expect(q.price).toBeLessThan(1.1);
    expect(typeof q.fee).toBe('number');
  });

  test('getMeteoraQuote returns expected shape and price range', async () => {
    const q = await router.getMeteoraQuote('SOL', 'USDC', 5);
    expect(q).toHaveProperty('dex', 'meteora');
    expect(typeof q.price).toBe('number');
    expect(q.price).toBeGreaterThan(0.9);
    expect(q.price).toBeLessThan(1.1);
    expect(typeof q.fee).toBe('number');
  });

  test('executeSwap returns txHash and executedPrice', async () => {
    const quote = await router.getRaydiumQuote('SOL','USDC',5);
    const exec = await router.executeSwap('raydium', { id: 'x' }, quote.price);
    expect(exec).toHaveProperty('txHash');
    expect(exec.txHash.startsWith('MOCKTX_')).toBe(true);
    expect(typeof exec.executedPrice).toBe('number');
  });
});
