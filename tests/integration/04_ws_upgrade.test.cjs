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


test("WebSocket upgrades successfully", async () => {
  const order = await fetch("http://localhost:3000/api/orders/execute", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ tokenIn:"SOL", tokenOut:"USDC", amountIn:1 })
  }).then(r => r.json());

  const url = `ws://localhost:3000${order.ws_url}`;
  const ws = new WebSocket(url);

  await new Promise(resolve => {
    ws.on("open", resolve);
  });

  expect(ws.readyState).toBe(WebSocket.OPEN);

  ws.close();
});
