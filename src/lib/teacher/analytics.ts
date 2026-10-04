export type TeacherEvent =
  | "teacher_lesson_view" | "teacher_lesson_start" | "teacher_question_answered"
  | "teacher_lesson_complete" | "teacher_author_click" | "teacher_profile_view"
  | "teacher_booking_click" | "teacher_booking_scheduled" | "teacher_social_click"
  | "teacher_lesson_share" | "teacher_signup" | "teacher_profile_complete"
  | "teacher_lesson_created" | "teacher_lesson_published";
export interface TeacherEventContext {
  teacher_id: string;
  lesson_id?: string | null;
  lesson_slug?: string | null;
  topic?: string | null;
  level?: string | null;
  seo_status?: string | null;
  source_page: string;
  booking_provider?: "calendly";
  social_provider?: string;
  question_id?: string;
  question_type?: string;
  correct?: boolean;
  score?: number;
  total?: number;
}
export interface TeacherEventPayload extends TeacherEventContext {
  visitor_id: string;
  referrer: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  lesson_id: string | null;
  lesson_slug: string | null;
  topic: string | null;
  level: string | null;
  seo_status: string | null;
}
export type TeacherAnalyticsAdapter = (event: TeacherEvent, properties: TeacherEventPayload) => void;
let adapter: TeacherAnalyticsAdapter | undefined;
let visitorId: string | undefined;
/** Register a consent-aware collector at integration time; UI has no vendor dependency. */
export function setTeacherAnalyticsAdapter(next?: TeacherAnalyticsAdapter) { adapter = next; }
function visitor() {
  if (visitorId) return visitorId;
  try { visitorId = sessionStorage.getItem("espanolreal:teacher:visitor") ?? undefined; } catch {}
  visitorId ??= globalThis.crypto?.randomUUID?.() ?? `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try { sessionStorage.setItem("espanolreal:teacher:visitor", visitorId); } catch {}
  return visitorId;
}
function safeReferrer() {
  try { const url = new URL(document.referrer); return `${url.origin}${url.pathname}`; } catch { return ""; }
}
export function trackTeacherEvent(event: TeacherEvent, context: TeacherEventContext) {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const properties: TeacherEventPayload = {
      lesson_id: null, lesson_slug: null, topic: null, level: null, seo_status: null,
      ...context, visitor_id: visitor(), referrer: safeReferrer(),
      utm_source: params.get("utm_source")?.slice(0, 200) ?? null,
      utm_medium: params.get("utm_medium")?.slice(0, 200) ?? null,
      utm_campaign: params.get("utm_campaign")?.slice(0, 200) ?? null,
    };
    window.dispatchEvent(new CustomEvent("espanolreal:teacher-analytics", { detail: { event, properties } }));
    adapter?.(event, properties);
  } catch { /* Tracking must never interrupt practice, booking or navigation. */ }
}
