// src/db.ts
import { Pool } from "pg";

export const db = new Pool({
  host: process.env.PG_HOST ?? "localhost",
  user: process.env.PG_USER ?? "postgres",
  password: process.env.PG_PASSWORD ?? "2006",
  database: process.env.PG_DB ?? "order_exec_engine",
  port: Number(process.env.PG_PORT ?? 5432),
});
