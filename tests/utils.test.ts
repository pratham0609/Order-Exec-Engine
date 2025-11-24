import { sleep } from '../src/utils';

describe('utils.sleep', () => {
  test('sleep resolves after given time', async () => {
    const t0 = Date.now();
    await sleep(50);
    const dt = Date.now() - t0;
    expect(dt).toBeGreaterThanOrEqual(40);
  });
});
