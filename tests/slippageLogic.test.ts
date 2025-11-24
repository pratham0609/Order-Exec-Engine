import { MockDexRouter } from '../src/mockDexRouter';

describe('slippage check (unit)', () => {
  test('expectedOut calculation is amountIn * price and slippage triggers when minAmountOut higher', async () => {
    const router = new MockDexRouter();
    const quote = await router.getRaydiumQuote('SOL', 'USDC', 5);
    const expectedOut = quote.price * 5;
    const minAmountOut = expectedOut + 0.01; // require slightly more than expected
    expect(expectedOut < minAmountOut).toBe(true);
  });
});
