import type { NextRequest } from "next/server";
import {
  SUPPORT_CATEGORY_META,
  escapeTelegramHtml,
  isSupportCategory,
  parseSupportReplyMarker,
  parseSupportStartPayload,
  supportAdminChatId,
  supportAnswerCallbackQuery,
  supportCategoryKeyboard,
  supportContextToken,
  supportPrompt,
  supportSendMessage,
  type SupportCategory,
  type SupportContext,
  type SupportTelegramUser,
  type SupportUpdate,
} from "@/lib/telegram/support-bot";
import { configuredSecret, errorResponse, jsonResponse, readJsonBody, secretHeaderOk } from "@/server/http";
import { getLesson } from "@/lib/content/loader";

export const dynamic = "force-dynamic";

function userName(user: SupportTelegramUser | undefined): string {
  if (!user) return "Unknown";
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || `id ${user.id}`;
}

async function showCategories(chatId: number, context: SupportContext = {}) {
  await supportSendMessage(
    chatId,
    [
      "🇪🇸 <b>Español Real · Поддержка</b>",
      "",
      "Что случилось? Выберите категорию:",
    ].join("\n"),
    { reply_markup: supportCategoryKeyboard(supportContextToken(context)) },
  );
}

async function askForMessage(chatId: number, category: SupportCategory, context: SupportContext = {}) {
  await supportSendMessage(chatId, supportPrompt(category, context), {
    reply_markup: { force_reply: true, selective: true, input_field_placeholder: "Опишите, что произошло…" },
  });
}

function callbackData(data: string | undefined): { category: SupportCategory; context: SupportContext } | null {
  if (!data) return null;
  const match = data.match(/^support:(bug|idea|question)(?::(.*))?$/);
  if (!match || !isSupportCategory(match[1])) return null;
  const token = match[2] ?? "";
  const lesson = token.match(/(?:^|_)l(\d{1,3})(?:_|$)/)?.[1];
  const card = token.match(/(?:^|_)c(\d{1,4})(?:_|$)/)?.[1];
  return {
    category: match[1],
    context: { lesson: lesson ? Number(lesson) : undefined, card: card ? Number(card) : undefined },
  };
}


function adminChatMatches(chatId: number): boolean {
  const admin = supportAdminChatId();
  return admin !== null && String(admin) === String(chatId);
}

function replyTargetFromAdminMessage(text: string | undefined, chatId: number): number | null {
  if (!adminChatMatches(chatId) || !text) return null;
  const match = text.match(/<b>Telegram ID:<\/b>\s*<code>(-?\d+)<\/code>/);
  if (!match) return null;
  const target = Number(match[1]);
  return Number.isSafeInteger(target) ? target : null;
}

async function forwardToAdmin(
  user: SupportTelegramUser | undefined,
  category: SupportCategory,
  context: SupportContext,
  message: string,
) {
  const admin = supportAdminChatId();
  if (!admin) return false;
  const meta = SUPPORT_CATEGORY_META[category];
  const lessonData = context.lesson ? getLesson(context.lesson) : null;
  const phrase = lessonData && context.card ? lessonData.phrases[context.card - 1] : null;
  const lines = [
    "🇪🇸 <b>Español Real · Support</b>",
    `${meta.emoji} <b>Type:</b> ${meta.code}`,
    "<b>Source:</b> @EspanolRealSupportBot",
    "",
    `<b>User:</b> ${escapeTelegramHtml(userName(user))}`,
    user?.username ? `<b>Username:</b> @${escapeTelegramHtml(user.username)}` : null,
    user ? `<b>Telegram ID:</b> <code>${user.id}</code>` : null,
    context.lesson ? `<b>Lesson:</b> ${context.lesson}` : null,
    context.card ? `<b>Card:</b> ${context.card}` : null,
    phrase ? `<b>Phrase:</b> ${escapeTelegramHtml(phrase.spanish)}` : null,
    phrase ? `<b>Translation:</b> ${escapeTelegramHtml(phrase.translation)}` : null,
    "",
    "<b>Message:</b>",
    escapeTelegramHtml(message.slice(0, 2500)),
  ].filter((line): line is string => Boolean(line));
  await supportSendMessage(admin, lines.join("\n"));
  return true;
}

export async function POST(request: NextRequest) {
  const expected = configuredSecret("TELEGRAM_SUPPORT_WEBHOOK_SECRET");
  if (!expected) return errorResponse("Support webhook authentication is not configured.", 503);
  if (!secretHeaderOk(request, "x-telegram-bot-api-secret-token", expected)) {
    return new Response("forbidden", { status: 403 });
  }

  const update = await readJsonBody<SupportUpdate>(request, 256 * 1024);
  if (!update) return jsonResponse({ ok: true, ignored: true });

  try {
    if (update.callback_query) {
      const query = update.callback_query;
      const parsed = callbackData(query.data);
      const chatId = query.message?.chat?.id;
      await supportAnswerCallbackQuery(query.id);
      if (parsed && chatId) await askForMessage(chatId, parsed.category, parsed.context);
      return jsonResponse({ ok: true, handled: "callback_query" });
    }

    const message = update.message;
    const chatId = message?.chat?.id;
    const text = message?.text?.trim();
    if (!message || !chatId || !text) return jsonResponse({ ok: true, ignored: true });

    if (/^\/id(?:@\w+)?$/i.test(text)) {
      await supportSendMessage(chatId, `Ваш Telegram chat ID: <code>${chatId}</code>`);
      return jsonResponse({ ok: true, handled: "id" });
    }

    const start = text.match(/^\/start(?:@\w+)?(?:\s+([A-Za-z0-9_-]{1,64}))?/i);
    if (start) {
      const parsed = parseSupportStartPayload(start[1]);
      if (parsed.category) await askForMessage(chatId, parsed.category, parsed.context);
      else await showCategories(chatId, parsed.context);
      return jsonResponse({ ok: true, handled: "start" });
    }

    // The admin can reply directly to the forwarded support message.
    // The forwarded message contains the user's Telegram ID, so no client-side
    // state or database mapping is required. Only the configured admin chat may use this path.
    const adminReplyTarget = replyTargetFromAdminMessage(message.reply_to_message?.text, chatId);
    if (adminReplyTarget !== null) {
      await supportSendMessage(adminReplyTarget, `👩‍💻 <b>Ответ разработчика:</b>\n\n${escapeTelegramHtml(text)}`, {
        reply_markup: supportCategoryKeyboard(),
      });
      await supportSendMessage(chatId, "✅ Ответ отправлен пользователю.");
      return jsonResponse({ ok: true, handled: "admin_reply" });
    }

    const reply = parseSupportReplyMarker(message.reply_to_message?.text);
    if (reply) {
      const delivered = await forwardToAdmin(message.from, reply.category, reply.context, text);
      await supportSendMessage(
        chatId,
        delivered
          ? "✅ Спасибо! Сообщение передано разработчику."
          : "⚙️ Сообщение принято, но канал пересылки ещё не настроен. Попробуйте позже.",
        { reply_markup: supportCategoryKeyboard() },
      );
      return jsonResponse({ ok: true, handled: "support_message" });
    }

    await showCategories(chatId);
    return jsonResponse({ ok: true, handled: "fallback" });
  } catch (error) {
    console.error("[telegram-support-webhook] temporary processing failure", error);
    return new Response("temporary failure", { status: 500 });
  }
}
