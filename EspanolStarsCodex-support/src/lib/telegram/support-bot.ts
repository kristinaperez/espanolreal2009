const API_ROOT = (process.env.TELEGRAM_API_URL ?? "https://api.telegram.org").replace(/\/$/, "");

export type SupportCategory = "bug" | "idea" | "question";

export interface SupportTelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface SupportTelegramMessage {
  message_id: number;
  from?: SupportTelegramUser;
  chat?: { id: number };
  text?: string;
  reply_to_message?: {
    message_id?: number;
    text?: string;
  };
}

export interface SupportCallbackQuery {
  id: string;
  from: SupportTelegramUser;
  data?: string;
  message?: SupportTelegramMessage;
}

export interface SupportUpdate {
  update_id: number;
  message?: SupportTelegramMessage;
  callback_query?: SupportCallbackQuery;
}

interface TgOk<T> {
  ok: true;
  result: T;
}

interface TgError {
  ok: false;
  description: string;
  error_code?: number;
}

type TgResponse<T> = TgOk<T> | TgError;

export class SupportBotError extends Error {
  constructor(message: string, readonly code?: number) {
    super(message);
    this.name = "SupportBotError";
  }
}

export function supportBotUsername(): string {
  return (
    process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_BOT_USERNAME?.trim().replace(/^@/, "") ||
    process.env.TELEGRAM_SUPPORT_BOT_USERNAME?.trim().replace(/^@/, "") ||
    "EspanolRealSupportBot"
  );
}

export function requireSupportBotToken(): string {
  const token = process.env.TELEGRAM_SUPPORT_BOT_TOKEN?.trim();
  if (!token || token.length < 10) {
    throw new SupportBotError("TELEGRAM_SUPPORT_BOT_TOKEN is not configured.");
  }
  return token;
}

export function supportBotConfigured(): boolean {
  try {
    return requireSupportBotToken().length >= 10;
  } catch {
    return false;
  }
}

export function supportAdminChatId(): number | string | null {
  const value = process.env.TELEGRAM_SUPPORT_ADMIN_CHAT_ID?.trim();
  if (!value) return null;
  if (/^-?\d+$/.test(value)) return Number(value);
  return value;
}

async function supportCall<T>(method: string, payload: Record<string, unknown> = {}): Promise<T> {
  const token = requireSupportBotToken();
  let response: Response;
  try {
    response = await fetch(`${API_ROOT}/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    throw new SupportBotError(`Network error calling Telegram ${method}: ${(error as Error).message}`);
  }

  let body: TgResponse<T> | null = null;
  try {
    body = (await response.json()) as TgResponse<T>;
  } catch {
    body = null;
  }
  if (!body) throw new SupportBotError(`Telegram ${method} returned a non-JSON response (${response.status}).`);
  if (!body.ok) throw new SupportBotError(`Telegram ${method} failed: ${body.description}`, body.error_code);
  return body.result;
}

export async function supportGetMe(): Promise<SupportTelegramUser> {
  return supportCall<SupportTelegramUser>("getMe");
}

export async function supportSetWebhook(url: string, secretToken: string) {
  return supportCall<boolean>("setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  });
}

export async function supportGetWebhookInfo(): Promise<Record<string, unknown>> {
  return supportCall<Record<string, unknown>>("getWebhookInfo");
}

export async function supportSendMessage(
  chatId: number | string,
  text: string,
  options: Record<string, unknown> = {},
) {
  return supportCall<SupportTelegramMessage>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...options,
  });
}

export async function supportAnswerCallbackQuery(id: string, text?: string) {
  return supportCall<boolean>("answerCallbackQuery", {
    callback_query_id: id,
    ...(text ? { text } : {}),
  });
}

export function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const SUPPORT_CATEGORY_META: Record<SupportCategory, { emoji: string; label: string; code: string }> = {
  bug: { emoji: "🐛", label: "Ошибка", code: "BUG" },
  idea: { emoji: "💡", label: "Предложение", code: "IDEA" },
  question: { emoji: "❓", label: "Вопрос", code: "QUESTION" },
};

export function isSupportCategory(value: unknown): value is SupportCategory {
  return value === "bug" || value === "idea" || value === "question";
}

export function supportCategoryKeyboard(context = "") {
  const suffix = context ? `:${context}` : "";
  return {
    inline_keyboard: [
      [{ text: "🐛 Ошибка", callback_data: `support:bug${suffix}` }],
      [{ text: "💡 Предложение", callback_data: `support:idea${suffix}` }],
      [{ text: "❓ Вопрос", callback_data: `support:question${suffix}` }],
    ],
  };
}

export interface SupportContext {
  lesson?: number;
  card?: number;
}

export function parseSupportStartPayload(payload: string | undefined): {
  category?: SupportCategory;
  context: SupportContext;
} {
  if (!payload) return { context: {} };
  const category = payload.match(/(?:^|_)(bug|idea|question)(?:_|$)/)?.[1];
  const lessonMatch = payload.match(/(?:^|_)l(\d{1,3})(?:_|$)/);
  const cardMatch = payload.match(/(?:^|_)c(\d{1,4})(?:_|$)/);
  return {
    category: isSupportCategory(category) ? category : undefined,
    context: {
      lesson: lessonMatch ? Number(lessonMatch[1]) : undefined,
      card: cardMatch ? Number(cardMatch[1]) : undefined,
    },
  };
}

export function supportContextToken(context: SupportContext): string {
  const bits: string[] = [];
  if (context.lesson) bits.push(`l${context.lesson}`);
  if (context.card) bits.push(`c${context.card}`);
  return bits.join("_");
}

export function supportPrompt(category: SupportCategory, context: SupportContext = {}): string {
  const meta = SUPPORT_CATEGORY_META[category];
  const contextLines = [
    context.lesson ? `Урок: ${context.lesson}` : null,
    context.card ? `Карточка: ${context.card}` : null,
  ].filter(Boolean);
  return [
    `${meta.emoji} <b>${meta.label}</b>`,
    ...contextLines,
    "",
    category === "bug" ? "Что случилось? Опишите ошибку одним сообщением." : "Напишите сообщение одним ответом.",
    "Можно написать по-русски.",
  ].join("\n");
}

export function parseSupportReplyMarker(text: string | undefined): {
  category: SupportCategory;
  context: SupportContext;
} | null {
  if (!text) return null;
  const category: SupportCategory | null = text.includes("🐛 Ошибка")
    ? "bug"
    : text.includes("💡 Предложение")
      ? "idea"
      : text.includes("❓ Вопрос")
        ? "question"
        : null;
  if (!category) return null;
  const lesson = text.match(/Урок:\s*(\d{1,3})/)?.[1];
  const card = text.match(/Карточка:\s*(\d{1,4})/)?.[1];
  return {
    category,
    context: { lesson: lesson ? Number(lesson) : undefined, card: card ? Number(card) : undefined },
  };
}
