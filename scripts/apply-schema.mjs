import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const { Client } = pg;
const root = process.cwd();

async function loadEnvFile() {
  const envPath = resolve(root, ".env.local");
  const env = await readFile(envPath, "utf8").catch(() => "");

  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/^"|"$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

await loadEnvFile();

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Set DIRECT_URL or DATABASE_URL in .env.local before running.");
}

const schemaPath = resolve(root, "supabase", "schema.sql");
const schemaSql = await readFile(schemaPath, "utf8");
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

await client.connect();

try {
  await client.query(schemaSql);
  console.log("Supabase schema applied successfully.");
} finally {
  await client.end();
}
