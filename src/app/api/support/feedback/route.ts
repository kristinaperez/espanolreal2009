import type { NextRequest } from "next/server";
import {
  SUPPORT_CATEGORY_META,
  escapeTelegramHtml,
  isSupportCategory,
  supportAdminChatId,
  supportSendMessage,
} from "@/lib/telegram/support-bot";
import { currentUser, errorResponse, jsonResponse, rateLimit, readJsonBody, serverErrorResponse } from "@/server/http";
import { publicDisplayName, toPublicUser } from "@/server/users";

export const dynamic = "force-dynamic";

interface FeedbackBody {
  type?: unknown;
  message?: unknown;
  issueReason?: unknown;
  context?: {
    lesson?: unknown;
    card?: unknown;
    phrase?: unknown;
    translation?: unknown;
    exerciseKind?: unknown;
    url?: unknown;
  };
}

const ISSUE_LABELS: Record<string, string> = {
  translation: "Неправильный перевод",
  spanish: "Ошибка в испанском",
  pronunciation: "Неправильное произношение",
  other: "Другое",
};

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, max) : null;
}

function cleanNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "support-feedback", 12, 60_000);
  if (limited) return limited;

  const adminChatId = supportAdminChatId();
  if (!adminChatId) return errorResponse("Канал поддержки ещё не настроен. Напишите нам через Telegram-бота.", 503);

  const body = await readJsonBody<FeedbackBody>(request, 16 * 1024);
  if (!body || !isSupportCategory(body.type)) return errorResponse("Выберите тип обращения.");

  const message = cleanText(body.message, 1800);
  const issueReason = cleanText(body.issueReason, 40);
  if (!message && !issueReason) return errorResponse("Расскажите, что произошло.");

  const context = body.context ?? {};
  const lesson = cleanNumber(context.lesson, 1, 999);
  const card = cleanNumber(context.card, 1, 9999);
  const phrase = cleanText(context.phrase, 500);
  const translation = cleanText(context.translation, 500);
  const exerciseKind = cleanText(context.exerciseKind, 80);
  const url = cleanText(context.url, 400);

  const user = await currentUser(request);
  const publicUser = user ? toPublicUser(user) : null;
  const displayName = publicUser ? publicDisplayName(publicUser) : "Не авторизован";
  const meta = SUPPORT_CATEGORY_META[body.type];

  const lines = [
    `🇪🇸 <b>Español Real · Support</b>`,
    `${meta.emoji} <b>Type:</b> ${meta.code}`,
    `<b>Source:</b> Web / Mini App`,
    "",
    `<b>User:</b> ${escapeTelegramHtml(displayName)}`,
    publicUser?.username ? `<b>Username:</b> @${escapeTelegramHtml(publicUser.username)}` : null,
    publicUser ? `<b>Telegram ID:</b> <code>${publicUser.telegramId}</code>` : `<b>Telegram ID:</b> —`,
    lesson ? `<b>Lesson:</b> ${lesson}` : null,
    card ? `<b>Card:</b> ${card}` : null,
    exerciseKind ? `<b>Exercise:</b> ${escapeTelegramHtml(exerciseKind)}` : null,
    phrase ? `<b>Phrase:</b> ${escapeTelegramHtml(phrase)}` : null,
    translation ? `<b>Translation:</b> ${escapeTelegramHtml(translation)}` : null,
    issueReason ? `<b>Issue:</b> ${escapeTelegramHtml(ISSUE_LABELS[issueReason] ?? issueReason)}` : null,
    url ? `<b>URL:</b> ${escapeTelegramHtml(url)}` : null,
    "",
    `<b>Message:</b>`,
    escapeTelegramHtml(message ?? "(без дополнительного комментария)"),
  ].filter((line): line is string => Boolean(line));

  try {
    await supportSendMessage(adminChatId, lines.join("\n"));
    return jsonResponse({ ok: true });
  } catch (error) {
    return serverErrorResponse("support-feedback", error, 502);
  }
}
