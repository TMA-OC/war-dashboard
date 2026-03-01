import { getDb, type Env } from "../../db/client";
import { users, pins, userPreferences, userAlerts, alerts } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { Alert } from "../../db/schema";

// In-memory SSE streams: userId -> ReadableStreamDefaultController
export const sseStreams = new Map<string, ReadableStreamDefaultController<string>>();

// ─── Haversine distance ───────────────────────────────────────────────────────

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Match alert to all users ─────────────────────────────────────────────────

export async function matchAlertToUsers(env: Env, alert: Alert): Promise<void> {
  const db = getDb(env);

  const allUsers = await db
    .select({
      userId: users.id,
      nationalities: userPreferences.nationalities,
      watchedCountries: userPreferences.watchedCountries,
      topics: userPreferences.topics,
    })
    .from(users)
    .leftJoin(userPreferences, eq(users.id, userPreferences.userId))
    .where(eq(users.isActive, true));

  for (const u of allUsers) {
    let matchReason: string | null = null;
    let matchedPinId: string | null = null;

    // 1. Check pin proximity
    if (alert.lat != null && alert.lng != null) {
      const userPins = await db
        .select()
        .from(pins)
        .where(and(eq(pins.userId, u.userId), eq(pins.isActive, true)));

      for (const pin of userPins) {
        const dist = haversineKm(pin.lat, pin.lng, alert.lat, alert.lng);
        if (dist <= pin.radiusKm) {
          matchReason = "pin_proximity";
          matchedPinId = pin.id;
          break;
        }
      }
    }

    // 2. Check country match
    if (!matchReason && alert.countryCode) {
      const nats = (u.nationalities as string[] | null) ?? [];
      const watched = (u.watchedCountries as string[] | null) ?? [];
      if (nats.includes(alert.countryCode) || watched.includes(alert.countryCode)) {
        matchReason = "country_match";
      }
    }

    // 3. Check topic match
    if (!matchReason) {
      const userTopics = (u.topics as string[] | null) ?? [];
      const alertTopics = alert.topics as string[] ?? [];
      if (userTopics.some((t) => alertTopics.includes(t))) {
        matchReason = "topic_match";
      }
    }

    if (!matchReason) continue;

    // Insert user_alert record (ignore duplicate)
    const [ua] = await db
      .insert(userAlerts)
      .values({
        userId: u.userId,
        alertId: alert.id,
        matchReason,
        matchedPinId: matchedPinId ?? undefined,
      })
      .onConflictDoNothing()
      .returning();

    if (!ua) continue;

    // Push SSE event to connected user
    const stream = sseStreams.get(u.userId);
    if (stream) {
      try {
        const payload = JSON.stringify({
          type: "new_alert",
          data: { userAlert: ua, alert },
        });
        stream.enqueue(`data: ${payload}\n\n`);
      } catch {
        // Stream closed — remove it
        sseStreams.delete(u.userId);
      }
    }
  }
}
