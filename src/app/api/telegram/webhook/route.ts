import type { NextRequest } from "next/server";
import {
  answerPreCheckoutQuery,
  sendMessage,
  type TgUpdate,
} from "@/lib/telegram/bot-api";
import { configuredSecret, errorResponse, jsonResponse, readJsonBody, secretHeaderOk } from "@/server/http";
import { fulfillOrder, getOrderByPayload } from "@/server/orders";
import { getUserById } from "@/server/users";

export const dynamic = "force-dynamic";

/**
 * POST — Telegram bot webhook. This is the authoritative payment confirmation:
 *
 *   pre_checkout_query  → answerPreCheckoutQuery(ok)
 *   successful_payment  → mark the order paid + issue a license key
 *
 * Register it once with:
 *   POST /api/telegram/setup with X-Admin-Secret.
 */
export async function POST(request: NextRequest) {
  const expected = configuredSecret("TELEGRAM_WEBHOOK_SECRET");
  if (!expected) {
    return errorResponse("Webhook authentication is not configured.", 503);
  }
  if (!secretHeaderOk(request, "x-telegram-bot-api-secret-token", expected)) {
    return new Response("forbidden", { status: 403 });
  }
  try {
    const { db } = await import("@/db");
    await db.execute(await (await import("drizzle-orm")).sql`select 1`);
  } catch {
    return errorResponse("Server persistence is unavailable. The offline trainer continues to work.", 503);
  }

  const update = await readJsonBody<TgUpdate>(request, 256 * 1024);
  if (!update) return jsonResponse({ ok: true, ignored: true });

  try {
    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      const order = await getOrderByPayload(query.invoice_payload);
      const user = order ? await getUserById(order.userId) : null;
      const allowed = Boolean(
        order &&
        user &&
        order.status === "pending" &&
        query.currency === order.currency &&
        query.total_amount === order.stars &&
        query.from.id === user.telegramId,
      );
      await answerPreCheckoutQuery(
        query.id,
        allowed,
        allowed ? undefined : "Заказ не найден или уже оплачен. Обновите страницу и попробуйте снова.",
      );
      return jsonResponse({ ok: true, handled: "pre_checkout_query" });
    }

    const payment = update.message?.successful_payment;
    if (payment) {
      const order = await getOrderByPayload(payment.invoice_payload);
      const user = order ? await getUserById(order.userId) : null;
      const payerId = update.message?.from?.id;
      const validPayment = Boolean(
        order &&
        user &&
        payment.currency === order.currency &&
        payment.total_amount === order.stars &&
        payerId === user.telegramId &&
        payment.telegram_payment_charge_id,
      );
      if (order && user && validPayment) {
        const fulfilled = await fulfillOrder(order.id, payment.telegram_payment_charge_id);
        const chatId = update.message?.chat?.id === user.telegramId ? user.telegramId : null;
        if (fulfilled && chatId) {
          try {
            await sendMessage(
              chatId,
              [
                "🇪🇸 <b>Español Real · Premium активирован</b>",
                "",
                "Все уроки, экзамены и система повторения открыты.",
                "",
                "Войдите через Telegram — доступ восстановится автоматически на любом устройстве.",
              ].join("\n"),
            );
          } catch {
            /* messaging is best-effort */
          }
        }
      }
      return jsonResponse({ ok: true, handled: "successful_payment" });
    }
  } catch (error) {
    console.error("[telegram-webhook] temporary processing failure", error);
    return new Response("temporary failure", { status: 500 });
  }

  return jsonResponse({ ok: true, ignored: true });
}
