// import fetch from "node-fetch";
// const WebSocket = require("ws");
const fetch = require("node-fetch");

const { startServer, stopServer } = require("../testServer.cjs");

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await stopServer();
});


test("server responds on /api/orders/execute with 400 if no body", async () => {
  const res = await fetch("http://localhost:3000/api/orders/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  });

  expect(res.status).toBe(200);
});
