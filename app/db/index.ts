import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/app/db/schema";

let cachedDb: NeonHttpDatabase<typeof schema> | null | undefined;

export function getDatabase() {
  if (cachedDb !== undefined) {
    return cachedDb;
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    cachedDb = null;
    return cachedDb;
  }
  cachedDb = drizzle(neon(databaseUrl), { schema });
  return cachedDb;
}

export function requireDatabase() {
  const db = getDatabase();
  if (!db) {
    throw new Error("DATABASE_URL is not configured. Set it in .env.local or your Vercel project.");
  }
  return db;
}
