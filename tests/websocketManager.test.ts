import { registerSocket, unregisterSocket, sendStatus } from '../src/websocketManager';

function makeFakeWs() {
  return {
    readyState: 1,
    OPEN: 1,
    send: jest.fn()
  } as any;
}

describe('websocketManager', () => {
  test('registerSocket and sendStatus sends when socket open', () => {
    const ws = makeFakeWs();
    registerSocket('order1', ws);
    const ok = sendStatus('order1', { status: 'routing', orderId: 'order1' });
    expect(ok).toBeTruthy();
    expect(ws.send).toHaveBeenCalled();
    unregisterSocket('order1');
  });

  test('sendStatus returns false when no socket registered', () => {
    // ensure no socket
    unregisterSocket('whatever');
    const ok = sendStatus('whatever', { status: 'pending' });
    expect(ok).toBeFalsy();
  });
});

