// // src/redis.ts
// import {Redis} from "ioredis";
// export const redis = new Redis({
//   host: process.env.REDIS_HOST ?? "127.0.0.1",
//   port: Number(process.env.REDIS_PORT ?? 6379),
//   maxRetriesPerRequest: null,   // REQUIRED for BullMQ v5
// });
//////////////////////////////////////////////////////////////////
import { Redis } from "ioredis";
const redisUrl = process.env.REDIS_URL;
export const redis = redisUrl
    ? new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    })
    : new Redis({
        host: process.env.REDIS_HOST ?? "127.0.0.1",
        port: Number(process.env.REDIS_PORT ?? 6379),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });
