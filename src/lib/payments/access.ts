import { ACCESS_PERIOD_MS, MONTHLY_PRODUCT_ID } from "./catalog";
export function licenseIsActive(productId: string, paidAt: Date | null, now = Date.now()): boolean {
  return productId === "premium-45" || (productId === MONTHLY_PRODUCT_ID && paidAt !== null && paidAt.getTime() + ACCESS_PERIOD_MS > now);
}
/** Paid purchases extend the remaining balance; refunded orders must be filtered by the caller. */
export function monthlyExpiry(payments: { productId: string; paidAt: Date | null }[]): Date | null {
  let end = 0;
  for (const payment of payments.filter(p => p.productId === MONTHLY_PRODUCT_ID && p.paidAt).sort((a,b) => a.paidAt!.getTime() - b.paidAt!.getTime())) {
    end = Math.max(end, payment.paidAt!.getTime()) + ACCESS_PERIOD_MS;
  }
  return end ? new Date(end) : null;
}
