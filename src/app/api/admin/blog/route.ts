import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blogArticles } from "@/db/blog-schema";
import { parseArticle } from "@/lib/blog";
import { isBlogAdmin, listArticles } from "@/server/blog";
import { currentUser, errorResponse, jsonResponse, readJsonBody, rateLimit, serverErrorResponse } from "@/server/http";
export const dynamic = "force-dynamic";
async function authorize(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return errorResponse("Войдите через Telegram", 401);
  if (!isBlogAdmin(user.telegramId)) return errorResponse("Доступ только для администратора", 403);
  return rateLimit(request, "blog-admin", 60, 60000, user.id);
}
export async function GET(request: NextRequest) {
  const denied = await authorize(request); if (denied) return denied;
  try { return jsonResponse({ articles: await listArticles(true) }); }
  catch (e) { return serverErrorResponse("blog-list", e); }
}
async function save(request: NextRequest, create: boolean) {
  const denied = await authorize(request); if (denied) return denied;
  if (request.headers.get("origin") !== request.nextUrl.origin) return errorResponse("Forbidden", 403);
  const input = parseArticle(await readJsonBody(request, 256000));
  if (!input) return errorResponse("Проверьте адрес, заголовок, описание и текст статьи", 400);
  try {
    if (create) {
      const [article] = await db.insert(blogArticles).values(input).onConflictDoNothing().returning();
      if (!article) return errorResponse("Такой адрес уже занят. Выберите другой.", 409);
      return jsonResponse({ article }, 201);
    }
    const [article] = await db.update(blogArticles).set({ ...input, updatedAt: new Date() }).where(eq(blogArticles.slug, input.slug)).returning();
    if (!article) return errorResponse("Статья не найдена", 404);
    return jsonResponse({ article });
  } catch (e) { return serverErrorResponse("blog-save", e); }
}
export const POST = (request: NextRequest) => save(request, true);
export const PUT = (request: NextRequest) => save(request, false);
