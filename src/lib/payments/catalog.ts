/**
 * Payment catalogue.
 *
 * Prices live in configuration so the storefront, the invoice and the license
 * checks never drift apart. Telegram Stars is the primary payment method;
 * everything routes through the same "product → paid → license" pipeline that
 * Stripe can be plugged into later.
 */

export interface Product {
  id: string;
  /** Invoice title, 1-32 characters. */
  title: string;
  /** Invoice description, 1-255 characters. */
  description: string;
  stars: number;
  currency: "XTR";
  /** Granted locally by this product (used for gate checks). */
  unlocks: "premium";
  lifetime: boolean;
}

export const DEFAULT_STARS_PRICE = 1490;
export const MONTHLY_PRODUCT_ID = "premium-monthly";

export function starsPrice(): number {
  return DEFAULT_STARS_PRICE;
}

export function premiumProduct(): Product {
  const stars = starsPrice();
  return {
    id: MONTHLY_PRODUCT_ID,
    title: "Español Real · Premium",
    description:
      "Все уроки курса, полная система повторения, экзамены и сертификат. Доступ на календарный месяц за 1490 Stars. Продление вручную, без автосписаний.",
    stars,
    currency: "XTR",
    unlocks: "premium",
    lifetime: false,
  };
}

export function getProduct(id: string): Product | null {
  const premium = premiumProduct();
  return premium.id === id ? premium : null;
}

export interface PaymentMethodDescriptor {
  id: "telegram_stars";
  enabled: boolean;
  label: string;
}

export function paymentMethods(): PaymentMethodDescriptor[] {
  return [{ id: "telegram_stars", enabled: true, label: `Telegram Stars · ${starsPrice()} ⭐` }];
}
