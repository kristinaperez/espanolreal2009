import type { NextRequest } from "next/server";
import { formatKey, normalizeKey } from "@/lib/license";
import { currentUser, errorResponse, jsonResponse, rateLimit, readJsonBody, serverErrorResponse } from "@/server/http";
import { getLicenseByKey, markLicenseActivated } from "@/server/orders";

export const dynamic = "force-dynamic";

/**
 * POST { key } — authoritative license check.
 *
 * Keys bought with Telegram Stars are validated against the database so a
 * This legacy-compatible endpoint never grants access from client-side state:
 * the key must already belong to the authenticated Telegram account.
 */
export async function POST(request: NextRequest) {
  try {
    const { db } = await import("@/db");
    await db.execute(await (await import("drizzle-orm")).sql`select 1`);
  } catch {
    return errorResponse("Server persistence is unavailable. The offline trainer continues to work.", 503);
  }

  const limited = rateLimit(request, "license-activate", 10, 60_000);
  if (limited) return limited;
  const user = await currentUser(request);
  if (!user) return errorResponse("Требуется вход через Telegram.", 401);

  const body = await readJsonBody<{ key?: string }>(request);
  if (!body?.key) return errorResponse("key is required");

  try {
    const clean = normalizeKey(body.key);
    const formatted = formatKey(clean);
    const license = (await getLicenseByKey(formatted)) ?? (await getLicenseByKey(clean));

    if (!license) {
      return jsonResponse({ ok: true, valid: false, reason: "invalid" });
    }

    if (license.userId !== user.id) {
      return jsonResponse({ ok: true, valid: false, reason: "invalid" });
    }

    await markLicenseActivated(license.key);
    return jsonResponse({
      ok: true,
      valid: true,
      productId: license.productId,
      source: license.source,
      issuedAt: new Date(license.issuedAt).toISOString(),
    });
  } catch (error) {
    return serverErrorResponse("license-activate", error);
  }
}
