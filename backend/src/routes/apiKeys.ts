import { Hono } from "hono";
import { getDb } from "../../db/client";
import { apiKeys } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";

const apiKeysRouter = new Hono<AppEnv>();

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "wd_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// GET /api-keys — list user's keys (no raw key, just prefix + metadata)
apiKeysRouter.get("/", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const db = getDb(c.env);
  const rows = await db
    .select({
      id: apiKeys.id,
      keyPrefix: apiKeys.keyPrefix,
      label: apiKeys.label,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId));
  return c.json({ data: rows });
});

// POST /api-keys — generate a new API key
apiKeysRouter.post("/", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const label = (body as any)?.label || "Default";

  const rawKey = generateApiKey();
  const hash = await sha256(rawKey);
  const prefix = rawKey.slice(0, 8);

  const db = getDb(c.env);
  const [row] = await db
    .insert(apiKeys)
    .values({ userId, keyHash: hash, keyPrefix: prefix, label })
    .returning({ id: apiKeys.id, keyPrefix: apiKeys.keyPrefix, label: apiKeys.label, createdAt: apiKeys.createdAt });

  // Return the raw key ONCE — never stored
  return c.json({ data: { ...row, key: rawKey } }, 201);
});

// DELETE /api-keys/:id — revoke a key
apiKeysRouter.delete("/:id", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const db = getDb(c.env);
  const [row] = await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
    .returning({ id: apiKeys.id });
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default apiKeysRouter;
