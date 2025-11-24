/**
 * Fastify route unit test (server logic without starting real network listener).
 * We import Fastify and register the same handlers as the server file would (lightweight).
 *
 * This test avoids importing the app's top-level server which starts a listener.
 */

import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { enqueueOrder } from '../src/producer';

jest.mock('../src/producer', () => ({
  enqueueOrder: jest.fn().mockResolvedValue({ id: 'abc123', tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 5 })
}));

describe('POST /api/orders/execute', () => {
  test('returns queued order payload', async () => {
    const app = Fastify();
    await app.register(websocket);

    app.post('/api/orders/execute', async (req, reply) => {
      const order = await enqueueOrder((req as any).body);
      return reply.send({ status: 'queued', orderId: order.id, ws_url: `/api/orders/upgrade/${order.id}`});
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/orders/execute',
      payload: { tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 5 }
    });

    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.status).toBe('queued');
    expect(json.orderId).toBe('abc123');

    await app.close();
  });
});
