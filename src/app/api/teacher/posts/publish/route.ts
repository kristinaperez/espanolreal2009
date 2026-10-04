import type { NextRequest } from "next/server";
import { currentUser, errorResponse, jsonResponse, rateLimit, readJsonBody, siteOrigin } from "@/server/http";
import { parseDraft, parsePost, resolveCta } from "@/lib/teacher-posts/model";
import { publishPost } from "@/server/teacher-posts/repository";
import { samePostOrigin } from "@/server/teacher-posts/origin";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  if (!samePostOrigin(request)) return errorResponse("Недопустимый источник запроса.", 403);
  const limited = rateLimit(request, "teacher-post-publish", 10, 60_000);
  if (limited) return limited;
  const user = await currentUser(request);
  if (!user) return errorResponse("Войдите через Telegram для публикации.", 401);
  const body = await readJsonBody<{ draft?: unknown; post?: unknown; mode?: unknown }>(request);
  const draft = parseDraft(body?.draft);
  const post = parsePost(body?.post);
  if (!draft || !post || !["ai", "mock"].includes(String(body?.mode))) return errorResponse("Проверьте текст поста и варианты мини-квиза.");
  try {
    const published = await publishPost(user, draft, { post, mode: body?.mode === "ai" ? "ai" : "mock", cta: resolveCta(draft, user.username, siteOrigin(request)) });
    return jsonResponse({ ok: true, slug: published.slug, cta: published.cta, path: `/teacher/posts/view?slug=${published.slug}` }, 201);
  } catch { return errorResponse("Публикация недоступна. Черновик сохранён на этом устройстве; текст можно скопировать.", 503); }
}
