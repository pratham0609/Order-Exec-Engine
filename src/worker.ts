// src/worker.ts
import { Worker, Job } from "bullmq";
import { redis } from "./redis.js";
import { db } from "./db.js";
import { MockDexRouter } from "./mockDexRouter.js";
// removed sendStatus import; worker persists only
// import { sendStatus } from "./websocketManager.js";

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

    // New: write 'pending' as soon as job starts (worker only)
    console.log(`[WORKER] status pending for ${orderId}`);
    await persist({ status: "pending" });

    try {
      console.log(`[WORKER] status routing for ${orderId}`);
      await persist({ status: "routing" });

      const [r, m] = await Promise.all([
        router.getRaydiumQuote(order.tokenIn, order.tokenOut, order.amountIn),
        router.getMeteoraQuote(order.tokenIn, order.tokenOut, order.amountIn),
      ]);

      const selected = (r.price - r.fee) >= (m.price - m.fee) ? r : m;

      console.log(`[WORKER] status building for ${orderId}`, { selected });
      await persist({ status: "building" });

      // slippage check (terminal failure, no retry)
      const expectedOut = selected.price * order.amountIn;
      if (order.minAmountOut !== null && order.minAmountOut !== undefined) {
        if (expectedOut < order.minAmountOut) {
          const errMsg = "Slippage too high compared to minAmountOut";
          console.warn(`[WORKER] slippage failure for ${orderId}: ${errMsg}`);

          await persist({
            status: "failed",
            lastError: errMsg,
          });

          return { error: errMsg };
        }
      }

      console.log(`[WORKER] status submitted for ${orderId}`, { dex: selected.dex });
      await persist({ status: "submitted" });

      const exec = await router.executeSwap(selected.dex, order, selected.price);

      console.log(`[WORKER] status confirmed for ${orderId}`, { txHash: exec.txHash, executedPrice: exec.executedPrice });
      await persist({
        status: "confirmed",
        txHash: exec.txHash,
        executedPrice: exec.executedPrice,
      });

      return exec;
    } catch (err: any) {
      const lastError = err?.message ?? "Unknown Error";
      console.error(`[WORKER] error for ${orderId}:`, lastError);

      await persist({
        status: "failed",
        lastError,
      });

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
