const CONSENT_KEY = "espanolreal:analytics-consent:v1";
const METRIKA_ID = 113580037;
const RETRY_MS = 500;
const MAX_ATTEMPTS = 20;

type AnalyticsWindow = { gtag?: (...args: unknown[]) => void; ym?: (...args: unknown[]) => void };

/**
 * Paywall funnel events, only after analytics consent. Never interrupts checkout.
 * GA4/Metrika load after consent ("afterInteractive"), so an early event waits
 * for the counters instead of being dropped.
 */
export function trackPaywall(event: "paywall_view" | "checkout_click", variant: string, attempt = 0): void {
  try {
    if (typeof window === "undefined" || localStorage.getItem(CONSENT_KEY) !== "accepted") return;
    const w = window as unknown as AnalyticsWindow;
    // Wait for both counters; after the last attempt send to whichever loaded (e.g. one is blocked).
    if ((!w.gtag || !w.ym) && attempt < MAX_ATTEMPTS && typeof setTimeout === "function") {
      setTimeout(() => trackPaywall(event, variant, attempt + 1), RETRY_MS);
      return;
    }
    try { w.gtag?.("event", event, { variant }); } catch { /* keep Metrika working */ }
    w.ym?.(METRIKA_ID, "reachGoal", event, { variant });
  } catch {
    /* Analytics must never break the paywall. */
  }
}
