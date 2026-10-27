import { MONTHLY_PRODUCT_ID } from "./catalog";

/**
 * One calendar month later, in UTC. A day that does not exist in the target
 * month is clamped to its last day (31 Jan → 28/29 Feb), keeping the time.
 */
export function addCalendarMonth(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(
    year, month, Math.min(date.getUTCDate(), lastDay),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds(),
  ));
}

export function licenseIsActive(productId: string, paidAt: Date | null, now = Date.now()): boolean {
  return productId === "premium-45" || (productId === MONTHLY_PRODUCT_ID && paidAt !== null && addCalendarMonth(paidAt).getTime() > now);
}

/** Paid purchases extend the remaining balance; refunded orders must be filtered by the caller. */
export function monthlyExpiry(payments: { productId: string; paidAt: Date | null }[]): Date | null {
  let end = 0;
  for (const payment of payments.filter(p => p.productId === MONTHLY_PRODUCT_ID && p.paidAt).sort((a,b) => a.paidAt!.getTime() - b.paidAt!.getTime())) {
    end = addCalendarMonth(new Date(Math.max(end, payment.paidAt!.getTime()))).getTime();
  }
  return end ? new Date(end) : null;
}
