// import WebSocket from "ws";
// import fetch from "node-fetch";
const WebSocket = require("ws");
const fetch = require("node-fetch");

const { startServer, stopServer } = require("../testServer.cjs");

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await stopServer();
});


test("handles 5 concurrent orders", async () => {
  const orders = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      fetch("http://localhost:3000/api/orders/execute", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ tokenIn:"SOL", tokenOut:"USDC", amountIn:5 })
      }).then(r => r.json())
    )
  );

  expect(orders.length).toBe(5);

  const connections = orders.map(o => new WebSocket(`ws://localhost:3000${o.ws_url}`));

  await new Promise(r => setTimeout(r, 7000));

  connections.forEach(ws => ws.close());
});
