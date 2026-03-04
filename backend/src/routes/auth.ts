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

function signToken(userId: string, secret: string): Promise<string> {
  return sign(
    { sub: userId, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
    secret
  );
}

// POST /auth/register
auth.post(
  "/register",
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
  zValidator("json", z.object({ id_token: z.string() })),
  async (c) => {
    const { id_token } = c.req.valid("json");

    // Verify with Google tokeninfo endpoint
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
    if (!googleRes.ok) {
      return c.json({ error: "Invalid Google token" }, 401);
    }

    const googlePayload = await googleRes.json() as {
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
