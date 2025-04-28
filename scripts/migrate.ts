import { db } from "../server/db";
import * as schema from "../shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool } from "@neondatabase/serverless";

async function main() {
  console.log("Starting database migration...");
  try {
    // Create tables for all schemas
    await db.execute(/* sql */`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT,
        full_name TEXT,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS routes (
        id SERIAL PRIMARY KEY,
        path TEXT NOT NULL,
        target TEXT NOT NULL,
        methods TEXT[] NOT NULL,
        rate_limit TEXT NOT NULL DEFAULT '100/minute',
        timeout INTEGER NOT NULL DEFAULT 5000,
        auth_required BOOLEAN NOT NULL DEFAULT FALSE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unknown',
        uptime TEXT NOT NULL DEFAULT '0%',
        response_time INTEGER NOT NULL DEFAULT 0,
        last_checked TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS stats (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT NOW(),
        total_requests INTEGER NOT NULL DEFAULT 0,
        requests_per_second INTEGER NOT NULL DEFAULT 0,
        avg_response_time INTEGER NOT NULL DEFAULT 0,
        error_rate TEXT NOT NULL DEFAULT '0%',
        active_connections INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS credentials (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        route_id INTEGER REFERENCES routes(id)
      );

      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
    `);

    console.log("Database migration completed successfully!");
  } catch (error) {
    console.error("Error during database migration:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });