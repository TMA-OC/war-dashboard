import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import type { Env } from "../db/client";
import authRouter from "./routes/auth";
import alertsRouter from "./routes/alerts";
import prefsRouter from "./routes/preferences";
import sourcesRouter from "./routes/sources";
import sseRouter from "./routes/sse";
import { pollAllFeeds } from "./cron/pollFeeds";

export type AppEnv = {
  Bindings: Env;
  Variables: {
    user: import("../db/schema").User;
    userId: string;
  };
};

const app = new Hono<AppEnv>();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: (origin, c) => c.env.FRONTEND_URL || "*",
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// ─── Health ───────────────────────────────────────────────────────────────────

app.get("/", (c) => c.json({ status: "ok", service: "war-dashboard-api", version: "1.0.0" }));
app.get("/health", (c) => c.json({ status: "ok", ts: new Date().toISOString() }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.route("/auth", authRouter);
app.route("/alerts", alertsRouter);
app.route("/preferences", prefsRouter);
app.route("/sources", sourcesRouter);
app.route("/sse", sseRouter);

// ─── Cloudflare Workers export ────────────────────────────────────────────────

export default {
  // HTTP requests
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  // Cron trigger (every 2 minutes)
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      pollAllFeeds(env)
        .then(({ polled, inserted }) => {
          console.log(`[cron] Polled ${polled} sources, inserted ${inserted} alerts`);
        })
        .catch((err) => {
          console.error("[cron] pollAllFeeds error:", err);
        })
    );
  },
};
