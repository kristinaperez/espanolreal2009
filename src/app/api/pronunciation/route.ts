import type { NextRequest } from "next/server";
import { currentUser, jsonResponse, rateLimit } from "@/server/http";
import { samePostOrigin } from "@/server/teacher-posts/origin";
import { pronunciationPhrases } from "@/lib/arabic/pronunciation-phrases";
import { assessPronunciation, azureConfigured, hasSignal, validateWav } from "@/server/pronunciation/azure";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fail = (code: string, status: number) => jsonResponse({ ok: false, code }, status);
export function GET() { return jsonResponse({ enabled: azureConfigured() }); }
export async function POST(request: NextRequest) {
  if (!samePostOrigin(request)) return fail("origin", 403);
  if (!azureConfigured()) return fail("unconfigured", 503);
  const user = await currentUser(request);
  if (!user) return fail("login_required", 401);
  if (rateLimit(request, "pronunciation-minute", 6, 60_000, user.telegramId) || rateLimit(request, "pronunciation-hour", 20, 3_600_000, user.telegramId)) return fail("rate_limited", 429);
  const url = new URL(request.url), slug = url.searchParams.get("lesson") ?? "", index = url.searchParams.get("phrase") ?? "";
  if (!/^\d{1,3}$/.test(index)) return fail("phrase", 400);
  const reference = pronunciationPhrases(slug)[Number(index)];
  if (!reference || request.headers.get("content-type") !== "audio/wav") return fail("format", 400);
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(declared) || declared > 512044) return fail("size", 413);
  const chunks: Uint8Array[] = []; let bytes = 0;
  const reader = request.body?.getReader();
  if (!reader) return fail("audio", 400);
  try {
    while (true) { const item = await reader.read(); if (item.done) break; bytes += item.value.byteLength; if (bytes > 512044) { await reader.cancel(); return fail("size", 413); } chunks.push(item.value); }
    const wav = Buffer.concat(chunks);
    if (!validateWav(wav)) return fail("format", 400);
    if (!hasSignal(wav)) return fail("no_speech", 422);
    const result = await assessPronunciation(wav, reference);
    return result ? jsonResponse({ ok: true, ...result }) : fail("no_assessment", 422);
  } catch { return fail("provider_unavailable", 502); }
}
