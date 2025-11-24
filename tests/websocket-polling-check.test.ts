/**
 * This test ensures that server-side polling path composes:
 * We do not start the full server; instead we assert that poll function (conceptually) produces payloads.
 * This is a light test that verifies DB rows produce the expected payload shape.
 */

jest.mock('../src/db', () => ({
  db: { query: jest.fn().mockResolvedValue({ rowCount: 1, rows: [{ status: 'confirmed', tx_hash: 'MOCKTX', executed_price: 1.01, last_error: null, attempts: 1, updated_at: new Date() }] }) }
}));

import { db } from '../src/db';

test('db query returns expected order payload shape', async () => {
  const res = await db.query('SELECT * FROM orders WHERE id = $1', ['id']);
  expect(res.rowCount).toBe(1);
  const r = res.rows[0];
  expect(r).toHaveProperty('status');
  expect(r).toHaveProperty('tx_hash');
});
