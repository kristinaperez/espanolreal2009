import type { NextRequest } from "next/server";
import { currentUser, errorResponse, jsonResponse, rateLimit, readJsonBody, siteOrigin } from "@/server/http";
import { parseDraft, resolveCta } from "@/lib/teacher-posts/model";
import { generatePost } from "@/server/teacher-posts/generate";
import { samePostOrigin } from "@/server/teacher-posts/origin";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  if (!samePostOrigin(request)) return errorResponse("Недопустимый источник запроса.", 403);
  const limited = rateLimit(request, "teacher-post-generation", 12, 60_000);
  if (limited) return limited;
  const raw = await readJsonBody<Record<string, unknown>>(request);
  const draft = parseDraft(raw);
  if (!draft) return errorResponse("Введите 20–8000 символов исходного текста и проверьте HTTPS-ссылки.");
  const user = await currentUser(request);
  const requestedMock = raw?.mode === "mock";
  if (!requestedMock && process.env.OPENAI_API_KEY && process.env.TEACHER_POST_AI_MODEL && !user) return errorResponse("Войдите через Telegram для AI-генерации.", 401);
  if (user) {
    const limitedUser = rateLimit(request, "teacher-post-account", 20, 3_600_000, user.telegramId);
    if (limitedUser) return limitedUser;
  }
  try {
    return jsonResponse({ ok: true, ...(await generatePost(draft, requestedMock)), cta: resolveCta(draft, user?.username ?? null, siteOrigin(request)) });
  } catch {
    return errorResponse("Не удалось создать пост. Исходный текст сохранён — попробуйте снова.", 502);
  }
}
