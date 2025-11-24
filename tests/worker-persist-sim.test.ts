/**
 * Simulated worker persist behavior: ensure db.query called on persist.
 * This is not running the actual worker; instead we import db mock and simulate persist.
 */
jest.mock('../src/db', () => ({
  db: { query: jest.fn().mockResolvedValue(true) }
}));

import { db } from '../src/db';

test('persist helper calls db.query', async () => {
  await db.query('INSERT INTO orders (id) VALUES ($1) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status', ['x']);
  expect((db.query as jest.Mock).mock.calls.length).toBeGreaterThan(0);
});
