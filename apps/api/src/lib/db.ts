import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { config, isConfigured } from "../config.js";

const here = dirname(fileURLToPath(import.meta.url));
// src/lib and dist/lib both sit two levels below apps/api.
const schemaFile = resolve(here, "../../db/schema.sql");

export const pool = isConfigured.database
  ? new pg.Pool({
      connectionString: config.databaseUrl,
      // Timeweb's managed Postgres accepts TLS from outside its network; its certificate is not
      // in Node's default store, so verification is skipped rather than shipping their CA here.
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
    })
  : null;

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  values: unknown[] = []
) {
  if (!pool) throw new Error("Database is not configured");
  return pool.query<T>(text, values);
}

/** Creates any missing tables and indexes. Safe to run on every start. */
export async function migrate() {
  if (!pool) return;
  await pool.query(readFileSync(schemaFile, "utf8"));
}

export async function databaseReachable() {
  if (!pool) return false;
  try {
    await pool.query("select 1");
    return true;
  } catch {
    return false;
  }
}
