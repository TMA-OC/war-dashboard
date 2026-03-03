import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sign, verify } from "hono/jwt";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../../db/client";
import { users, userPreferences } from "../../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";

const auth = new Hono<AppEnv>();

const SALT_ROUNDS = 10;

// ─── Rate Limiting (in-memory, per IP) ────────────────────────────────────────
// In production, use Cloudflare's built-in rate limiting or a KV store

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 20; // Max 20 auth attempts per 15 min window

function getRateLimitKey(ip: string, endpoint: string): string {
  return `${ip}:${endpoint}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Clean up expired entries
  if (entry && entry.resetAt < now) {
    rateLimitMap.delete(key);
  }

  const existing = rateLimitMap.get(key);

  if (!existing) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.count, resetAt: existing.resetAt };
}

// Rate limit middleware for auth endpoints
const rateLimitMiddleware = async (c: any, next: any) => {
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
  const endpoint = c.req.path;
  const key = getRateLimitKey(ip, endpoint);

  const { allowed, remaining, resetAt } = checkRateLimit(key);

  c.header("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS.toString());
  c.header("X-RateLimit-Remaining", remaining.toString());
  c.header("X-RateLimit-Reset", Math.ceil(resetAt / 1000).toString());

  if (!allowed) {
    return c.json(
      { error: "Too many requests. Please try again later." },
      429
    );
  }

  await next();
};

function signToken(userId: string, secret: string): Promise<string> {
  return sign(
    { sub: userId, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
    secret
  );
}

// POST /auth/register
auth.post(
  "/register",
  rateLimitMiddleware,
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      displayName: z.string().optional(),
    })
  ),
  async (c) => {
    const { email, password, displayName } = c.req.valid("json");
    const db = getDb(c.env);

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return c.json({ error: "Email already registered" }, 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, displayName: displayName ?? email.split("@")[0] })
      .returning();

    if (!user) return c.json({ error: "Failed to create user" }, 500);

    // create default preferences
    await db.insert(userPreferences).values({ userId: user.id });

    const token = await signToken(user.id, c.env.JWT_SECRET);
    return c.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, tier: user.tier } }, 201);
  }
);

// POST /auth/login
auth.post(
  "/login",
  rateLimitMiddleware,
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  ),
  async (c) => {
    const { email, password } = c.req.valid("json");
    const db = getDb(c.env);

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !user.passwordHash) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    if (!user.isActive) {
      return c.json({ error: "Account disabled" }, 403);
    }

    const token = await signToken(user.id, c.env.JWT_SECRET);
    return c.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, tier: user.tier } });
  }
);

// POST /auth/google
auth.post(
  "/google",
  rateLimitMiddleware,
  zValidator("json", z.object({ id_token: z.string() })),
  async (c) => {
    const { id_token } = c.req.valid("json");

    // Verify with Google tokeninfo endpoint
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
    if (!googleRes.ok) {
      return c.json({ error: "Invalid Google token" }, 401);
    }

    const googlePayload = (await googleRes.json()) as {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
      aud: string;
    };

    if (googlePayload.aud !== c.env.GOOGLE_CLIENT_ID) {
      return c.json({ error: "Token audience mismatch" }, 401);
    }

    const db = getDb(c.env);

    // Upsert user
    let [user] = await db.select().from(users).where(eq(users.googleId, googlePayload.sub)).limit(1);

    if (!user) {
      // Check if email already exists (link accounts)
      const [byEmail] = await db.select().from(users).where(eq(users.email, googlePayload.email)).limit(1);
      if (byEmail) {
        // Link Google to existing account
        const [updated] = await db
          .update(users)
          .set({ googleId: googlePayload.sub, avatarUrl: googlePayload.picture, updatedAt: new Date() })
          .where(eq(users.id, byEmail.id))
          .returning();
        user = updated!;
      } else {
        const [created] = await db
          .insert(users)
          .values({
            email: googlePayload.email,
            googleId: googlePayload.sub,
            displayName: googlePayload.name,
            avatarUrl: googlePayload.picture,
          })
          .returning();
        user = created!;
        await db.insert(userPreferences).values({ userId: user.id });
      }
    }

    if (!user.isActive) {
      return c.json({ error: "Account disabled" }, 403);
    }

    const token = await signToken(user.id, c.env.JWT_SECRET);
    return c.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, tier: user.tier } });
  }
);

// GET /auth/me
auth.get("/me", authMiddleware, (c) => {
  const user = c.get("user");
  return c.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    tier: user.tier,
    createdAt: user.createdAt,
  });
});

export default auth;
