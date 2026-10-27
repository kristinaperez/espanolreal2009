const CONSENT_KEY = "espanolreal:analytics-consent:v1";
const METRIKA_ID = 113580037;

type AnalyticsWindow = { gtag?: (...args: unknown[]) => void; ym?: (...args: unknown[]) => void };

/** Paywall funnel events, only after analytics consent. Never interrupts checkout. */
export function trackPaywall(event: "paywall_view" | "checkout_click", variant: string): void {
  try {
    if (typeof window === "undefined" || localStorage.getItem(CONSENT_KEY) !== "accepted") return;
    const w = window as unknown as AnalyticsWindow;
    w.gtag?.("event", event, { variant });
    w.ym?.(METRIKA_ID, "reachGoal", event, { variant });
  } catch {
    /* Analytics must never break the paywall. */
  }
}
