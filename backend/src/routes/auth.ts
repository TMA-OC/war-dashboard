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
      tier: z.enum(["individual", "pro"]).optional().default("individual"),
    })
  ),
  async (c) => {
    const { email, password, displayName, tier } = c.req.valid("json");
    const db = getDb(c.env);

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return c.json({ error: "Email already registered" }, 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, displayName: displayName ?? email.split("@")[0], tier: tier ?? "individual" })
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


// GET /auth/google — initiate OAuth redirect flow
auth.get("/google", (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${new URL(c.req.url).origin}/auth/google/callback`;
  const scope = "openid email profile";
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");
  return c.redirect(url.toString());
});

// GET /auth/google/callback — handle OAuth callback
auth.get("/google/callback", async (c) => {
  const code = c.req.query("code");
  const error = c.req.query("error");

  if (error || !code) {
    return c.redirect(`${c.env.FRONTEND_URL}/login?error=oauth_denied`);
  }

  const origin = new URL(c.req.url).origin;
  const redirectUri = `${origin}/auth/google/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return c.redirect(`${c.env.FRONTEND_URL}/login?error=token_exchange_failed`);
  }

  const { id_token } = await tokenRes.json() as { id_token: string };

  // Verify id_token and get user info
  const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
  if (!googleRes.ok) {
    return c.redirect(`${c.env.FRONTEND_URL}/login?error=invalid_token`);
  }

  const googlePayload = await googleRes.json() as {
    sub: string; email: string; name: string; picture: string; aud: string;
  };

  if (googlePayload.aud !== c.env.GOOGLE_CLIENT_ID) {
    return c.redirect(`${c.env.FRONTEND_URL}/login?error=invalid_audience`);
  }

  const db = getDb(c.env);
  let [user] = await db.select().from(users).where(eq(users.googleId, googlePayload.sub)).limit(1);

  if (!user) {
    const [byEmail] = await db.select().from(users).where(eq(users.email, googlePayload.email)).limit(1);
    if (byEmail) {
      await db.update(users).set({ googleId: googlePayload.sub, avatarUrl: googlePayload.picture, updatedAt: new Date() }).where(eq(users.id, byEmail.id));
      user = { ...byEmail, googleId: googlePayload.sub, avatarUrl: googlePayload.picture };
    } else {
      const [newUser] = await db.insert(users).values({
        email: googlePayload.email,
        googleId: googlePayload.sub,
        displayName: googlePayload.name,
        avatarUrl: googlePayload.picture,
      }).returning();
      if (newUser) {
        await db.insert(userPreferences).values({ userId: newUser.id });
        user = newUser;
      }
    }
  }

  if (!user) {
    return c.redirect(`${c.env.FRONTEND_URL}/login?error=user_creation_failed`);
  }

  const token = await signToken(user.id, c.env.JWT_SECRET);
  // Redirect to frontend with token in query param — frontend reads it and stores in localStorage
  return c.redirect(`${c.env.FRONTEND_URL}/auth/callback?token=${token}&email=${encodeURIComponent(user.email)}&tier=${user.tier}`);
});
export default auth;
