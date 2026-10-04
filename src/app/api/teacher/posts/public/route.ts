import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse, rateLimit } from "@/server/http";
import { publicPost } from "@/server/teacher-posts/repository";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "teacher-post-public", 120, 60_000);
  if (limited) return limited;
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!/^post-[0-9a-f-]{36}$/.test(slug)) return errorResponse("Пост не найден.", 404);
  try {
    const post = await publicPost(slug);
    return post ? jsonResponse({ ok: true, ...post }) : errorResponse("Пост не найден.", 404);
  } catch { return errorResponse("Не удалось загрузить пост. Попробуйте позже.", 503); }
}
