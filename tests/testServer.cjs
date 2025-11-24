// tests/testServer.cjs

const path = require("path");

let fastifyApp = null;
let started = false;

async function startServer() {
  if (started) return fastifyApp;

  // Resolve absolute path to server.ts
  const serverPath = path.resolve(__dirname, "../src/server.ts");

  // IMPORTANT: dynamic import required for ESM + top-level await
  const appModule = await import(serverPath);
  fastifyApp = appModule.default;

  // Start Fastify
  await fastifyApp.listen({ port: 3000, host: "0.0.0.0" });
  console.log("[TEST SERVER] Started on 3000");

  started = true;
  return fastifyApp;
}

async function stopServer() {
  if (fastifyApp && started) {
    await fastifyApp.close();
    console.log("[TEST SERVER] Stopped");
    fastifyApp = null;
    started = false;
  }
}

module.exports = { startServer, stopServer };
