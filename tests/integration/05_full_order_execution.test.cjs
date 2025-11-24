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


test("entire order lifecycle emits correct sequence", async () => {
  const order = await fetch("http://localhost:3000/api/orders/execute", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ tokenIn:"SOL", tokenOut:"USDC", amountIn:5 })
  }).then(r => r.json());

  const ws = new WebSocket(`ws://localhost:3000${order.ws_url}`);

  const events = [];

  ws.on("message", msg => {
    const json = JSON.parse(msg);
    events.push(json.status);
  });

  await new Promise(resolve => setTimeout(resolve, 6000));

  expect(events).toContain("pending");
  expect(events).toContain("routing");
  expect(events).toContain("building");
  expect(events).toContain("submitted");
  expect(events).toContain("confirmed");

  ws.close();
});
