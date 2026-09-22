import type { NextRequest } from "next/server";
import { getMe, getWebhookInfo, isBotConfigured, setWebhook } from "@/lib/telegram/bot-api";
import { getBotUsername } from "@/lib/telegram/crypto";
import { adminSecretOk, configuredSecret, errorResponse, jsonResponse, rateLimit, serverErrorResponse } from "@/server/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/telegram/setup with X-Admin-Secret.
 *
 * One-time helper that registers the payment webhook for the bot.
 * After that Telegram confirms Stars payments automatically.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "telegram-setup", 5, 60_000);
  if (limited) return limited;
  if (!adminSecretOk(request)) {
    return errorResponse("Неверный секрет администратора.", 403);
  }
  const webhookSecret = configuredSecret("TELEGRAM_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return errorResponse("TELEGRAM_WEBHOOK_SECRET должен быть отдельным секретом длиной не менее 32 байт.", 503);
  }
  try {
    const { db } = await import("@/db");
    await db.execute(await (await import("drizzle-orm")).sql`select 1`);
  } catch {
    return errorResponse("Server persistence is unavailable. The offline trainer continues to work.", 503);
  }

  if (!isBotConfigured()) {
    return errorResponse("TELEGRAM_BOT_TOKEN не задан.", 503);
  }
  let origin: string;
  try {
    const configured = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    if (configured.protocol !== "https:") throw new Error("https required");
    origin = configured.origin;
  } catch {
    return errorResponse("NEXT_PUBLIC_SITE_URL должен быть корректным HTTPS origin.", 503);
  }
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL ?? `${origin}/api/telegram/webhook`;

  try {
    const me = await getMe();
    const registered = await setWebhook(webhookUrl, webhookSecret);
    const info = await getWebhookInfo();
    return jsonResponse({
      ok: true,
      bot: { username: me.username, id: me.id },
      configuredBotUsername: getBotUsername(),
      webhookUrl,
      registered,
      webhookInfo: info,
      loginWidgetUrl: `${origin}/learn/settings`,
      note: "Добавьте этот домен в BotFather (/setdomain), чтобы работала кнопка входа через Telegram.",
    });
  } catch (error) {
    return serverErrorResponse("telegram-webhook-setup", error, 502);
  }
}
