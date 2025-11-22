// src/worker.ts
import { Worker, Job } from "bullmq";
import { redis } from "./redis.js";
import { db } from "./db.js";
import { MockDexRouter } from "./mockDexRouter.js";
import { sendStatus } from "./websocketManager.js";
// import "dotenv/config";

const router = new MockDexRouter();

type Order = {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  minAmountOut?: number | null;
  type?: string;
};

const worker = new Worker(
  "orderQueue",
  async (job: Job) => {
    console.log("WORKER RECEIVED JOB:", job.id, job.name);
    console.log("JOB DATA:", job.data);
    const order = job.data as Order;
    const orderId = order.id;

    // Persist helper using raw SQL
    const persist = async (patch: any) => {
      console.log("DB PERSIST START:", patch); 
      await db.query(
        `INSERT INTO orders (
            id, token_in, token_out, amount_in, min_amount_out, type,
            status, tx_hash, executed_price, attempts, last_error,
            created_at, updated_at
         ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW()
         )
         ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            tx_hash = EXCLUDED.tx_hash,
            executed_price = EXCLUDED.executed_price,
            attempts = EXCLUDED.attempts,
            last_error = EXCLUDED.last_error,
            updated_at = NOW();`,
        [
          orderId,
          order.tokenIn,
          order.tokenOut,
          order.amountIn,
          order.minAmountOut ?? null,
          order.type ?? "market",
          patch.status,
          patch.txHash ?? null,
          patch.executedPrice ?? null,
          job.attemptsMade + 1,
          patch.lastError ?? null,
        ]
      );
      console.log("DB PERSIST SUCCESS"); 
    };

    try {
      sendStatus(orderId, { status: "routing", orderId });

      await persist({ status: "routing" });

      // Fetch quotes concurrently
      const [r, m] = await Promise.all([
        router.getRaydiumQuote(order.tokenIn, order.tokenOut, order.amountIn),
        router.getMeteoraQuote(order.tokenIn, order.tokenOut, order.amountIn),
      ]);

      const selected = (r.price - r.fee) >= (m.price - m.fee) ? r : m;

      sendStatus(orderId, { status: "building", orderId, selected });
      await persist({ status: "building" });

      const expectedOut = selected.price * order.amountIn;
      // if (order.minAmountOut && expectedOut < order.minAmountOut) {
      //   throw new Error("Slippage too high");
      // }
      // slippage protection check — treat as terminal failure (no retries)
      const expectedOut = selected.price * order.amountIn;
      if (order.minAmountOut && expectedOut < order.minAmountOut) {
        const errMsg = 'Slippage too high compared to minAmountOut';

        // send a specific websocket status so clients can react
        sendStatus(orderId, { status: 'slippage_failed', orderId, reason: errMsg, ts: new Date().toISOString() });
            
        // persist a failed state (do not rethrow — return to finish job without retriggering retries)
        await persist({ status: 'failed', lastError: errMsg });
            
        // stop processing this job gracefully
        return { error: errMsg };
      }


      sendStatus(orderId, { status: "submitted", orderId, dex: selected.dex });
      await persist({ status: "submitted" });

      const exec = await router.executeSwap(selected.dex, order, selected.price);

      sendStatus(orderId, {
        status: "confirmed",
        orderId,
        txHash: exec.txHash,
        executedPrice: exec.executedPrice,
      });

      await persist({
        status: "confirmed",
        txHash: exec.txHash,
        executedPrice: exec.executedPrice,
      });

      return exec;
    } catch (err: any) {
      const lastError = err?.message ?? "Unknown Error";

      sendStatus(orderId, { status: "failed", orderId, lastError });

      await persist({
        status: "failed",
        lastError,
      });
      console.error("WORKER ERROR:", err);

      throw err;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  }
);
worker.on("failed", (job, err) => {
  console.error("JOB FAILED:", job?.id, err);
});
console.log("Worker running…");
export default worker;
