import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 5, // pool size — keep small for Workers / serverless
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
