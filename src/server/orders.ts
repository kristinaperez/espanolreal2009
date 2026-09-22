import { randomBytes } from "node:crypto";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { licenses, orders, telegramUsers, type LicenseRow, type OrderRow } from "@/db/schema";
import { getStarTransactions, type TgStarTransaction } from "@/lib/telegram/bot-api";
import type { Product } from "@/lib/payments/catalog";

export function buildPayload(product: Product, userId: number): string {
  return `${product.id}:${userId}:${Date.now().toString(36)}:${randomBytes(4).toString("hex")}`;
}

export async function createPendingOrder(
  userId: number,
  product: Product,
): Promise<OrderRow> {
  const [row] = await db
    .insert(orders)
    .values({
      userId,
      productId: product.id,
      stars: product.stars,
      currency: product.currency,
      status: "pending",
      payload: buildPayload(product, userId),
    })
    .returning();
  return row;
}

export async function attachInvoiceLink(orderId: number, invoiceLink: string) {
  await db.update(orders).set({ invoiceLink }).where(eq(orders.id, orderId));
}

export async function getOrderForUser(orderId: number, userId: number): Promise<OrderRow | null> {
  const [row] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function getOrderByPayload(payload: string): Promise<OrderRow | null> {
  const [row] = await db.select().from(orders).where(eq(orders.payload, payload)).limit(1);
  return row ?? null;
}

export async function getRecentOrdersForUser(userId: number, limit = 5): Promise<OrderRow[]> {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

const LICENSE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LICENSE_LENGTH = 20;
const LICENSE_PREFIX = "ESPA";

export function generateLicenseKey(): string {
  const chars = LICENSE_PREFIX.split("");
  while (chars.length < LICENSE_LENGTH) {
    chars.push(LICENSE_ALPHABET[randomBytes(1)[0] % LICENSE_ALPHABET.length]);
  }
  return (chars.join("").match(/.{1,4}/g) ?? []).join("-");
}

export async function issueLicenseForOrder(order: OrderRow): Promise<LicenseRow> {
  const [existing] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.orderId, order.id))
    .limit(1);
  if (existing) return existing;

  for (let attempt = 0; attempt < 5; attempt++) {
    const key = generateLicenseKey();
    try {
      const [row] = await db
        .insert(licenses)
        .values({
          key,
          userId: order.userId,
          orderId: order.id,
          productId: order.productId,
          source: "telegram_stars",
        })
        .onConflictDoNothing({ target: licenses.orderId })
        .returning();
      if (row) return row;
      const [createdByAnotherRequest] = await db
        .select()
        .from(licenses)
        .where(eq(licenses.orderId, order.id))
        .limit(1);
      if (createdByAnotherRequest) return createdByAnotherRequest;
    } catch {
      // Extremely unlikely key collision — regenerate.
    }
  }
  throw new Error("could not issue a license key");
}

export interface FulfilledOrder {
  order: OrderRow;
  license: LicenseRow;
}

/** Marks an order as paid and guarantees exactly one license per order. */
export async function fulfillOrder(orderId: number, chargeId: string | null): Promise<FulfilledOrder | null> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;

  if (chargeId) {
    const [chargeOwner] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.chargeId, chargeId), ne(orders.id, orderId)))
      .limit(1);
    if (chargeOwner) return null;
  }

  if (order.status !== "paid") {
    if (order.status !== "pending") return null;
    const [updated] = await db
      .update(orders)
      .set({ status: "paid", chargeId, paidAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
      .returning();
    const [latest] = updated
      ? [updated]
      : await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!latest || latest.status !== "paid") return null;
    if (chargeId && latest.chargeId !== chargeId) return null;
    const finalOrder = latest;
    const license = await issueLicenseForOrder(finalOrder);
    return { order: finalOrder, license };
  }

  if (chargeId && order.chargeId !== chargeId) return null;

  const license = await issueLicenseForOrder(order);
  return { order, license };
}

export async function getLicenseByKey(key: string): Promise<LicenseRow | null> {
  const [row] = await db.select().from(licenses).where(eq(licenses.key, key)).limit(1);
  return row ?? null;
}

export async function markLicenseActivated(key: string) {
  await db.update(licenses).set({ activatedAt: new Date() }).where(eq(licenses.key, key));
}

export async function findPaidLicenseForUser(userId: number): Promise<LicenseRow | null> {
  const [row] = await db
    .select()
    .from(licenses)
    .innerJoin(
      orders,
      and(eq(licenses.orderId, orders.id), eq(orders.status, "paid")),
    )
    .where(eq(licenses.userId, userId))
    .orderBy(desc(licenses.issuedAt))
    .limit(1);
  return row?.licenses ?? null;
}

const STARS_LOOKUP_WINDOW_MS = 15 * 60 * 1000;

/**
 * Fallback payment verification used when the bot webhook is not reachable.
 *
 * `getStarTransactions` returns incoming payments with the transaction id equal
 * to `SuccessfulPayment.telegram_payment_charge_id`, and (when available) the
 * invoice payload inside `source`. Matching requires that exact payload; an
 * amount/date-only fallback could attribute an unrelated payment.
 */
export async function verifyOrderThroughStarsHistory(
  order: OrderRow,
  telegramId: number,
): Promise<{ paid: boolean; chargeId: string | null; transaction: TgStarTransaction | null }> {
  let history;
  try {
    const result = await getStarTransactions(0, 100);
    history = result.star_transactions ?? [];
  } catch {
    return { paid: false, chargeId: null, transaction: null };
  }

  const createdMs = new Date(order.createdAt).getTime();
  const candidates = history.filter((transaction) => {
    if (transaction.amount !== order.stars) return false;
    if (!transaction.source) return false;
    const dateMs = transaction.date * 1000;
    return dateMs >= createdMs - STARS_LOOKUP_WINDOW_MS && dateMs <= Date.now() + 60_000;
  });

  const byPayload = candidates.find(
    (transaction) => transaction.source?.invoice_payload === order.payload,
  );
  const transaction = byPayload ?? null;

  if (!transaction) return { paid: false, chargeId: null, transaction: null };
  if (transaction.source?.user?.id !== undefined && transaction.source.user.id !== telegramId) {
    return { paid: false, chargeId: null, transaction: null };
  }

  // Guard against double-spending the same transaction across orders.
  const [existing] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.chargeId, transaction.id), ne(orders.id, order.id)))
    .limit(1);
  if (existing) return { paid: false, chargeId: null, transaction: null };

  return { paid: true, chargeId: transaction.id, transaction };
}

export async function countPaidOrders(): Promise<number> {
  const rows = await db
    .select({ id: orders.id, userId: orders.userId })
    .from(orders)
    .innerJoin(telegramUsers, eq(orders.userId, telegramUsers.id))
    .where(eq(orders.status, "paid"));
  return rows.length;
}
