import type { NextRequest } from "next/server";
import { currentUser, errorResponse, jsonResponse, rateLimit, serverErrorResponse } from "@/server/http";
import { resolveTrial, setTrialCookie, trialActive, completeTrial, TRIAL_MS } from "@/server/trial";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser(request);
    const trial = await resolveTrial(request, user?.id);
    return jsonResponse({ active: trial ? trialActive(trial) : true, started: !!trial,
      expiresAt: trial ? new Date(trial.startedAt.getTime() + TRIAL_MS).toISOString() : null });
  } catch (e) { return serverErrorResponse("trial-status", e); }
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return errorResponse("Forbidden", 403);
  const limited = rateLimit(request, "trial-complete", 30, 60000); if (limited) return limited;
  try {
    const user = await currentUser(request);
    const trial = await resolveTrial(request, user?.id);
    if (!trial) return errorResponse("Сначала начните урок", 409);
    await completeTrial(trial.id);
    const response = jsonResponse({ ok: true, active: false }); setTrialCookie(response, trial.id); return response;
  } catch (e) { return serverErrorResponse("trial-complete", e); }
}
