import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { verify } from "hono/jwt";
import { getDb } from "../../db/client";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { sseStreams } from "../agents/alertMatcher";
import type { AppEnv } from "../types";

const sseRouter = new Hono<AppEnv>();

// GET /sse/alerts?token=JWT
sseRouter.get("/alerts", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Missing token" }, 401);
  }

  let userId: string;
  try {
    const payload = await verify(token, c.env.JWT_SECRET, "HS256");
    userId = payload["sub"] as string;
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }

  const db = getDb(c.env);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.isActive) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return streamSSE(c, async (stream) => {
    // Register this user's SSE controller
    // We use a readable stream approach with a queue
    let closed = false;
    const queue: string[] = [];

    const controller: ReadableStreamDefaultController<string> = {
      enqueue(chunk: string) {
        if (!closed) {
          queue.push(chunk);
          flush();
        }
      },
      close() {
        closed = true;
        sseStreams.delete(userId);
      },
      error(e: unknown) {
        closed = true;
        sseStreams.delete(userId);
        console.error("[SSE] stream error:", e);
      },
      get desiredSize() { return 1; },
    } as unknown as ReadableStreamDefaultController<string>;

    sseStreams.set(userId, controller);

    async function flush() {
      while (queue.length > 0 && !closed) {
        const chunk = queue.shift();
        if (chunk) {
          await stream.write(chunk);
        }
      }
    }

    // Send initial heartbeat
    await stream.writeSSE({ event: "connected", data: JSON.stringify({ userId }), id: "0" });

    // Keep alive with heartbeats every 30s
    let pingCount = 0;
    const pingInterval = setInterval(async () => {
      if (closed) {
        clearInterval(pingInterval);
        return;
      }
      try {
        await stream.writeSSE({ event: "ping", data: JSON.stringify({ ts: Date.now() }), id: String(++pingCount) });
      } catch {
        closed = true;
        clearInterval(pingInterval);
        sseStreams.delete(userId);
      }
    }, 30_000);

    // Hold the connection open until client disconnects
    await stream.sleep(60 * 60 * 1000); // max 1 hour (CF Worker limit)

    // Cleanup
    closed = true;
    clearInterval(pingInterval);
    sseStreams.delete(userId);
  });
});

export default sseRouter;
