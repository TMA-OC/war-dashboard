import { createMiddleware } from "hono/factory";
import { getDb } from "../../db/client";
import { apiKeys, users } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { AppEnv } from "../types";

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const apiKeyMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  let rawKey: string | null = null;
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    rawKey = authHeader.slice(7);
  } else {
    rawKey = c.req.query("api_key") ?? null;
  }

  if (!rawKey) {
    return c.json({ error: "API key required" }, 401);
  }

  const hash = await sha256(rawKey);
  const db = getDb(c.env);

  const [keyRow] = await db
    .select({ id: apiKeys.id, userId: apiKeys.userId, isActive: apiKeys.isActive })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, hash), eq(apiKeys.isActive, true)))
    .limit(1);

  if (!keyRow) {
    return c.json({ error: "Invalid or inactive API key" }, 401);
  }

  const [user] = await db.select().from(users).where(eq(users.id, keyRow.userId)).limit(1);
  if (!user || !user.isActive) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", user);
  c.set("userId", user.id);
  await next();
});
