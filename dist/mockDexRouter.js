// src/mockDexRouter.ts
import { sleep } from "./utils.js";
import { v4 as uuidv4 } from "uuid";
export class MockDexRouter {
    basePrice = 1;
    async getRaydiumQuote(tokenIn, tokenOut, amount) {
        await sleep(200 + Math.random() * 200);
        const price = this.basePrice * (0.98 + Math.random() * 0.04);
        return { dex: "raydium", price, fee: 0.003 };
    }
    async getMeteoraQuote(tokenIn, tokenOut, amount) {
        await sleep(200 + Math.random() * 300);
        const price = this.basePrice * (0.97 + Math.random() * 0.05);
        return { dex: "meteora", price, fee: 0.002 };
    }
    async executeSwap(dex, order, simulatedPrice) {
        await sleep(2000 + Math.random() * 1000);
        const txHash = "MOCKTX_" + uuidv4().replace(/-/g, "").slice(0, 20);
        const executedPrice = simulatedPrice * (1 + (Math.random() - 0.5) * 0.001);
        return { txHash, executedPrice };
    }
}
export function createMockDexRouter() {
    return new MockDexRouter();
}
