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


test("order fails with slippage_failed if minAmountOut too high", async () => {
  const order = await fetch("http://localhost:3000/api/orders/execute", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      tokenIn:"SOL",
      tokenOut:"USDC",
      amountIn:5,
      minAmountOut:9999   // impossible
    })
  }).then(r => r.json());

  const ws = new WebSocket(`ws://localhost:3000${order.ws_url}`);

  let got = null;

  ws.on("message", msg => {
    const json = JSON.parse(msg);
    if (json.status === "slippage_failed") got = json;
  });

  await new Promise(r => setTimeout(r, 4000));

  expect(got).not.toBeNull();

  ws.close();
});
