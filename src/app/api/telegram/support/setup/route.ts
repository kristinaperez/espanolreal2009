import type { NextRequest } from "next/server";
import {
  supportBotConfigured,
  supportBotUsername,
  supportGetMe,
  supportGetWebhookInfo,
  supportSetWebhook,
} from "@/lib/telegram/support-bot";
import {
  adminSecretOk,
  configuredSecret,
  errorResponse,
  jsonResponse,
  rateLimit,
  serverErrorResponse,
} from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "telegram-support-setup", 5, 60_000);
  if (limited) return limited;
  if (!adminSecretOk(request)) return errorResponse("Неверный секрет администратора.", 403);

  const webhookSecret = configuredSecret("TELEGRAM_SUPPORT_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return errorResponse("TELEGRAM_SUPPORT_WEBHOOK_SECRET должен быть отдельным секретом длиной не менее 32 байт.", 503);
  }
  if (!supportBotConfigured()) return errorResponse("TELEGRAM_SUPPORT_BOT_TOKEN не задан.", 503);

  let origin: string;
  try {
    const configured = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    if (configured.protocol !== "https:") throw new Error("https required");
    origin = configured.origin;
  } catch {
    return errorResponse("NEXT_PUBLIC_SITE_URL должен быть корректным HTTPS origin.", 503);
  }

  const webhookUrl = process.env.TELEGRAM_SUPPORT_WEBHOOK_URL ?? `${origin}/api/telegram/support/webhook`;
  try {
    const me = await supportGetMe();
    const registered = await supportSetWebhook(webhookUrl, webhookSecret);
    const info = await supportGetWebhookInfo();
    return jsonResponse({
      ok: true,
      bot: { username: me.username, id: me.id },
      configuredBotUsername: supportBotUsername(),
      webhookUrl,
      registered,
      webhookInfo: info,
      next: "Откройте бота и отправьте /id, затем сохраните полученный chat ID в TELEGRAM_SUPPORT_ADMIN_CHAT_ID.",
    });
  } catch (error) {
    return serverErrorResponse("telegram-support-webhook-setup", error, 502);
  }
}
