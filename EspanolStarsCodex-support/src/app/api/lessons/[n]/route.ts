import type { NextRequest } from "next/server";
import { FREE_LESSON_COUNT } from "@/lib/content/config";
import { getDistractorPool, getLesson } from "@/lib/content/loader";
import { isFreeLesson } from "@/lib/content/secure";
import { currentUser, errorResponse, jsonResponse, rateLimit, serverErrorResponse } from "@/server/http";
import { findPaidLicenseForUser } from "@/server/orders";

export const dynamic = "force-dynamic";

/**
 * GET /api/lessons/8
 *
 * Delivers the full lesson content (and its distractor pool) to entitled users.
 * Free lessons are public; premium lessons require a signed-in Telegram account
 * with a server-confirmed paid order.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ n: string }> },
) {
  const limited = rateLimit(request, "lesson-content", 120, 60_000);
  if (limited) return limited;

  const { n } = await params;
  const lessonNumber = Number(n);
  if (!Number.isFinite(lessonNumber) || lessonNumber <= 0) {
    return errorResponse("Некорректный номер урока", 400);
  }

  const lesson = getLesson(lessonNumber);
  if (!lesson) return errorResponse("Урок не найден", 404);

  if (isFreeLesson(lessonNumber)) {
    return jsonResponse({
      ok: true,
      lesson,
      pool: getDistractorPool(lessonNumber, 40),
      access: "free" as const,
      freeLessonCount: FREE_LESSON_COUNT,
    });
  }

  // Telegram session with a paid order.
  try {
    const user = await currentUser(request);
    if (user) {
      const license = await findPaidLicenseForUser(user.id);
      if (license) {
        return jsonResponse({
          ok: true,
          lesson,
          pool: getDistractorPool(lessonNumber, 40),
          access: "telegram-account" as const,
          freeLessonCount: FREE_LESSON_COUNT,
        });
      }
    }
  } catch (error) {
    return serverErrorResponse("lesson-content", error);
  }

  return jsonResponse(
    {
      ok: false,
      error: "Этот урок входит в Premium. Оплатите 500 ⭐ в Telegram, чтобы получить доступ.",
      freeLessonCount: FREE_LESSON_COUNT,
    },
    402,
  );
}
