// // src/redis.ts
// import {Redis} from "ioredis";

// export const redis = new Redis({
//   host: process.env.REDIS_HOST ?? "127.0.0.1",
//   port: Number(process.env.REDIS_PORT ?? 6379),
//   maxRetriesPerRequest: null,   // REQUIRED for BullMQ v5
// });


//////////////////////////////////////////////////////////////////

import { Redis } from "ioredis";

console.log("REDIS_URL from env:", process.env.REDIS_URL);
console.log("REDIS_HOST:", process.env.REDIS_HOST);
console.log("REDIS_PORT:", process.env.REDIS_PORT);

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

