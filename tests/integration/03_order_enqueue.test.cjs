// import fetch from "node-fetch";
const fetch = require("node-fetch");

const { startServer, stopServer } = require("../testServer.cjs");

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await stopServer();
});


test("POST /api/orders/execute returns orderId and ws_url", async () => {
  const body = {
    tokenIn: "SOL",
    tokenOut: "USDC",
    amountIn: 5
  };

  const res = await fetch("http://localhost:3000/api/orders/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const json = await res.json();

  expect(json.orderId).toBeDefined();
  expect(json.ws_url).toContain(json.orderId);
});
