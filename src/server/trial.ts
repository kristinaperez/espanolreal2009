import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { learningTrials } from "@/db/blog-schema";
import { sessionCookieOptions } from "@/lib/session";
const COOKIE = "er_trial";
export const TRIAL_MS = 7 * 86400000;
function signature(id: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw Error("SESSION_SECRET is required");
  return createHmac("sha256", secret).update(`trial:${id}`).digest("hex");
}
export function readTrialId(token?: string): string | null {
  if (!token) return null;
  const [id, sig] = token.split(".");
  if (!/^[0-9a-f-]{36}$/.test(id || "") || !/^[0-9a-f]{64}$/.test(sig || "")) return null;
  const expected = signature(id);
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? id : null;
}
export function trialActive(row: { startedAt: Date; completedAt: Date | null }, now = Date.now()) {
  return !row.completedAt && row.startedAt.getTime() + TRIAL_MS > now;
}
export async function resolveTrial(request: NextRequest, userId?: number, start = false) {
  const id = readTrialId(request.cookies.get(COOKIE)?.value);
  const [guest] = id ? await db.select().from(learningTrials).where(eq(learningTrials.id, id)).limit(1) : [];
  // Account trials survive clearing browser storage; merge the earliest start and completion.
  if (userId) {
    const [account] = await db.select().from(learningTrials).where(eq(learningTrials.userId, userId)).limit(1);
    if (account) {
      if (guest && guest.id !== account.id && guest.userId === null) {
        const [merged] = await db.update(learningTrials).set({
          startedAt: sql`least(${learningTrials.startedAt}, ${guest.startedAt})`,
          completedAt: sql`coalesce(${learningTrials.completedAt}, ${guest.completedAt})`,
        }).where(eq(learningTrials.id, account.id)).returning();
        return merged;
      }
      return account;
    }
    // Use a stable per-account ID to avoid duplicate creation under concurrent requests.
    if (!start && !guest) return null;
    const [row] = await db.insert(learningTrials).values({ id: `user-${userId}`, userId,
      startedAt: guest?.startedAt, completedAt: guest?.completedAt,
    }).onConflictDoUpdate({ target: learningTrials.userId, set: { userId } }).returning();
    return row;
  }
  // A signed guest cookie is never allowed to select another account's trial.
  if (guest && guest.userId === null) return guest;
  if (!start) return null;
  const [row] = await db.insert(learningTrials).values({ id: randomUUID() }).returning();
  return row;
}
export function setTrialCookie(response: NextResponse, id: string) {
  // Account trials are addressed by the authenticated account, never by a guest cookie.
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  response.cookies.set(COOKIE, `${id}.${signature(id)}`, sessionCookieOptions(365 * 86400));
}
export async function completeTrial(id: string) {
  await db.update(learningTrials).set({ completedAt: new Date() })
    .where(and(eq(learningTrials.id, id), isNull(learningTrials.completedAt)));
}
