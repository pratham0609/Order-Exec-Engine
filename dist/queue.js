// src/queue.ts
import { Queue } from "bullmq";
import { redis } from "./redis.js";
export const orderQueue = new Queue("orderQueue", {
    connection: redis,
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
