// import fetch from "node-fetch";
// import { db } from "../../src/db.js";
const fetch = require("node-fetch");
const { db } = require("../../src/db");

const { startServer, stopServer } = require("../testServer.cjs");

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await stopServer();
});


test("order appears in DB after execution", async () => {
  const order = await fetch("http://localhost:3000/api/orders/execute", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ tokenIn:"SOL", tokenOut:"USDC", amountIn:1 })
  }).then(r => r.json());

  await new Promise(r => setTimeout(r, 5000));

  const row = await db.query("SELECT * FROM orders WHERE id = $1", [order.orderId]);

  expect(row.rowCount).toBe(1);
});
