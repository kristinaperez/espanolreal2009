import type { NextRequest } from "next/server";
import { getDistractorPool, getLesson } from "@/lib/content/loader";
import { currentUser, errorResponse, jsonResponse, rateLimit, serverErrorResponse } from "@/server/http";
import { findPaidLicenseForUser } from "@/server/orders";
import { starsPrice } from "@/lib/payments/catalog";
import { resolveTrial, setTrialCookie, trialActive, TRIAL_MS } from "@/server/trial";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, { params }: { params: Promise<{ n: string }> }) {
  const limited = rateLimit(request, "lesson-content", 120, 60000); if (limited) return limited;
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n <= 0) return errorResponse("Некорректный номер урока", 400);
  const lesson = getLesson(n); if (!lesson) return errorResponse("Урок не найден", 404);
  try {
    const user = await currentUser(request);
    const license = user ? await findPaidLicenseForUser(user.id) : null;
    // Telegram login is required before the free lesson: the trial belongs to an account.
    if (!user && !license) return errorResponse("Войдите через Telegram, чтобы начать бесплатный урок.", 401);
    const trial = !license && user ? await resolveTrial(request, user.id, n === 1) : null;
    if (!license && !(n === 1 && trial && trialActive(trial))) return errorResponse(`Пробный доступ завершён. Продолжите за ${starsPrice()} ⭐ на месяц.`, 402);
    const response = jsonResponse({ ok: true, lesson, pool: getDistractorPool(n, 40), access: license ? "premium" : "trial", trialExpiresAt: trial ? new Date(trial.startedAt.getTime() + TRIAL_MS).toISOString() : null });
    if (trial) setTrialCookie(response, trial.id);
    return response;
  } catch (e) { return serverErrorResponse("lesson-content", e, 503); }
}
