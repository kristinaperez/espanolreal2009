import { NextResponse, type NextRequest } from "next/server";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { telegramUsers, type TelegramUserRow } from "@/db/schema";
import { telegramIdFromRequest } from "@/lib/session";
import { getUserByTelegramId } from "@/server/users";

export function jsonResponse(data: unknown, status = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  response.headers.set("cache-control", "no-store");
  return response;
}

export function errorResponse(message: string, status = 400): NextResponse {
  return jsonResponse({ ok: false, error: message }, status);
}

const DEFAULT_JSON_LIMIT = 32 * 1024;

export async function readJsonBody<T>(
  request: Request,
  maxBytes = DEFAULT_JSON_LIMIT,
): Promise<T | null> {
  try {
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(declared) && declared > maxBytes) return null;
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > maxBytes) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

type RateBucket = { count: number; resetAt: number };

const globalForSecurity = globalThis as typeof globalThis & {
  __espanolRealRateLimits?: Map<string, RateBucket>;
};

const rateLimits = globalForSecurity.__espanolRealRateLimits ?? new Map<string, RateBucket>();
if (process.env.NODE_ENV !== "production") globalForSecurity.__espanolRealRateLimits = rateLimits;

function clientAddress(request: NextRequest): string {
  return (
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Best-effort per-instance limiter. Keep a platform/edge limiter enabled as the outer layer. */
export function rateLimit(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
  subject?: string | number,
): NextResponse | null {
  const now = Date.now();
  const key = `${scope}:${subject ?? clientAddress(request)}`;
  const current = rateLimits.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;
  bucket.count += 1;
  rateLimits.set(key, bucket);

  if (rateLimits.size > 5_000) {
    for (const [candidate, value] of rateLimits) {
      if (value.resetAt <= now) rateLimits.delete(candidate);
    }
  }

  if (bucket.count <= limit) return null;
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  const response = errorResponse("Слишком много запросов. Повторите позже.", 429);
  response.headers.set("retry-after", String(retryAfter));
  return response;
}

function safeTextEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function configuredSecret(name: string, minBytes = 32): string | null {
  const value = process.env[name]?.trim();
  return value && Buffer.byteLength(value, "utf8") >= minBytes ? value : null;
}

export function secretHeaderOk(request: NextRequest, header: string, secret: string): boolean {
  const provided = request.headers.get(header) ?? "";
  return safeTextEqual(provided, secret);
}

export function serverErrorResponse(context: string, error: unknown, status = 500): NextResponse {
  const incidentId = randomUUID();
  console.error(`[${context}] incident=${incidentId}`, error);
  return errorResponse(`Внутренняя ошибка. Код: ${incidentId}`, status);
}

/** Current signed-in account, or null. */
export async function currentUser(request: NextRequest): Promise<TelegramUserRow | null> {
  const telegramId = telegramIdFromRequest(request);
  if (telegramId === null) return null;
  try {
    return await getUserByTelegramId(telegramId);
  } catch {
    return null;
  }
}

export async function touchUser(id: number) {
  try {
    await db
      .update(telegramUsers)
      .set({ lastAuthAt: new Date() })
      .where(eq(telegramUsers.id, id));
  } catch {
    /* non-critical */
  }
}

export function siteOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through to the request origin */
    }
  }
  return new URL(request.url).origin;
}

export function adminSecretOk(request: NextRequest): boolean {
  const expected = configuredSecret("ADMIN_SECRET");
  if (!expected) return false;
  return secretHeaderOk(request, "x-admin-secret", expected);
}
