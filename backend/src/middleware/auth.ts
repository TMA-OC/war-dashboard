import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { getDb } from "../../db/client";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../types";

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verify(token, c.env.JWT_SECRET, "HS256");
    const userId = payload["sub"] as string;

    const db = getDb(c.env);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user || !user.isActive) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", user);
    c.set("userId", user.id);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

export const proMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get("user");
  if (user.tier !== "pro") {
    return c.json({ error: "Pro subscription required" }, 403);
  }
  await next();
});
