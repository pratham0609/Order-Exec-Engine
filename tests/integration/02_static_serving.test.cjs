// import fetch from "node-fetch";
const fetch = require("node-fetch");

const { startServer, stopServer } = require("../testServer.cjs");

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await stopServer();
});


test("client.html is served correctly", async () => {
  const res = await fetch("http://localhost:3000/static/client.html");
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html.includes("Order Execution Engine")).toBe(true);
});
