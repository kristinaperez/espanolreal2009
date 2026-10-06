import type { NextRequest } from "next/server";
import { currentUser, errorResponse, jsonResponse, rateLimit, readJsonBody } from "@/server/http";
import { samePostOrigin } from "@/server/teacher-posts/origin";
import { parseTeacherSocialLinks } from "@/lib/teacher-socials";
import { readTeacherSocials, saveTeacherSocials } from "@/server/teacher-settings/store";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
 try {
  const user = await currentUser(request);
  if (!user) return errorResponse("Войдите в кабинет преподавателя.",401);
  const links = parseTeacherSocialLinks(await readTeacherSocials(user.telegramId));
  return jsonResponse({ links: links ?? {} });
 } catch { return errorResponse("Настройки временно недоступны.",503); }
}
export async function PUT(request: NextRequest) {
 if (!samePostOrigin(request)) return errorResponse("Недопустимый источник запроса.",403);
 const limited = rateLimit(request,"teacher-settings",20,60_000);
 if (limited) return limited;
 try {
  const user = await currentUser(request);
  if (!user) return errorResponse("Войдите в кабинет преподавателя.",401);
  const body = await readJsonBody<{ links?: unknown }>(request,24_000);
  const links = parseTeacherSocialLinks(body?.links);
  if (!links) return errorResponse("Укажите HTTPS-ссылки на профили или каналы соответствующих соцсетей.");
  await saveTeacherSocials(user.telegramId,links);
  return jsonResponse({ links });
 } catch { return errorResponse("Не удалось сохранить настройки.",503); }
}
