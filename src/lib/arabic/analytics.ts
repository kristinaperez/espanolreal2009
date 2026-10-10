"use client";
export type ArabicEvent = "arabic_page_view" | "arabic_cta_click" | "arabic_lesson_start" | "arabic_lesson_complete" | "arabic_signup" | "arabic_purchase" | "arabic_audio_play" | "arabic_next_lesson";
export interface ArabicEventPayload { event: ArabicEvent; properties: { page: string; lesson_id: string | null; locale: "ar"; source: string } }
const pending: ArabicEventPayload[] = [];
export function trackArabicEvent(event: ArabicEvent, lessonId?: string) {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem("espanolreal:analytics-consent:v1") !== "accepted") return;
    const source = new URLSearchParams(window.location.search).get("utm_source")?.slice(0, 100) ?? "direct";
    pending.push({ event, properties: { page: window.location.pathname, lesson_id: lessonId ?? null, locale: "ar", source } });
    if (pending.length > 50) pending.shift();
    window.dispatchEvent(new Event("espanolreal:arabic-analytics"));
  } catch { /* Analytics never interrupts a lesson. */ }
}
export function clearArabicEvents() { pending.length = 0; }
export function flushArabicEvents() {
  try {
    if (localStorage.getItem("espanolreal:analytics-consent:v1") !== "accepted") { pending.length = 0; return; }
    if (!window.gtag) return;
    for (const item of pending.splice(0)) {
      window.gtag("event", item.event, item.properties);
      window.ym?.(113580037, "reachGoal", item.event, item.properties);
    }
  } catch { /* Collector failures do not affect UI. */ }
}
