import * as dotenv from "dotenv";
import path from "path";

// 🔥 Load .env file from project root
dotenv.config({
  path: path.resolve(__dirname, "../../../.env"),
});

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// ✅ Ensure DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// ✅ Create PostgreSQL pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ✅ Initialize Drizzle ORM
export const db = drizzle(pool, { schema });

// ✅ Export all schema
export * from "./schema";