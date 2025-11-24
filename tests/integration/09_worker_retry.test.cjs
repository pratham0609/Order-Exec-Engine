// import fetch from "node-fetch";
// import WebSocket from "ws";
const fetch = require("node-fetch");

const { startServer, stopServer } = require("../testServer.cjs");

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await stopServer();
});


test("worker retries failed jobs (at least once)", async () => {
  const spyFail = jest.spyOn(console, "error").mockImplementation(() => {});

  const order = await fetch("http://localhost:3000/api/orders/execute", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      tokenIn:"FAIL",
      tokenOut:"USDC",
      amountIn:1
    })
  }).then(r => r.json());

  await new Promise(r => setTimeout(r, 4000));

  expect(spyFail).toHaveBeenCalled();

  spyFail.mockRestore();
});
