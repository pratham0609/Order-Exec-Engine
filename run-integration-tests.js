import { execSync } from "child_process";

console.log("=== STARTING SERVER ===");
const server = execSync("npm run dev &", { stdio: "inherit" });
await new Promise(r => setTimeout(r, 2000));

console.log("=== STARTING WORKER ===");
const worker = execSync("npm run worker &", { stdio: "inherit" });
await new Promise(r => setTimeout(r, 1000));

console.log("=== RUNNING INTEGRATION TESTS ===");
execSync("node --experimental-vm-modules ./node_modules/jest/bin/jest.js --runInBand tests/integration", { stdio: "inherit" });

console.log("=== INTEGRATION SUITE COMPLETE ===");
