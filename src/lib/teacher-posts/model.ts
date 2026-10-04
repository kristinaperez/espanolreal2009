export const tones = ["conversational", "humor"] as const;
export const levels = ["A1-A2", "B1-B2", "slang", "conversational"] as const;
export interface LessonDraft {
  topic: string;
  sourceText: string;
  tone: typeof tones[number];
  level: typeof levels[number];
  teacherLessonsUrl: string;
  lessonUrl: string;
  lessonName: string;
  includeCta: boolean;
}
export interface WowPost {
  title: string;
  hook: string;
  example: string;
  explanation: string;
  interactiveQuestion: { question: string; options: string[]; correctIndex: number; feedback: string };
}
export interface PostCta { label: string; url: string }
export interface GeneratedPost { post: WowPost; cta: PostCta | null; mode: "mock" | "ai" }
export interface TeacherPost extends GeneratedPost {
  slug: string;
  authorName: string;
  status: "published";
  publishedAt: string;
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, min: number, max: number): v is string => typeof v === "string" && v.trim().length >= min && v.length <= max;
export function safePostUrl(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const u = new URL(value.trim());
    if (u.protocol !== "https:" || u.username || u.password || u.port || !u.hostname.includes(".") || /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(u.hostname)) return null;
    return u.toString();
  } catch { return null; }
}
export function parseDraft(v: unknown): LessonDraft | null {
  if (!record(v) || !text(v.topic, 0, 160) || !text(v.sourceText, 20, 8000) || !tones.includes(v.tone as LessonDraft["tone"]) || !levels.includes(v.level as LessonDraft["level"]) || typeof v.includeCta !== "boolean") return null;
  for (const field of ["teacherLessonsUrl", "lessonUrl", "lessonName"]) if (!text(v[field], 0, field === "lessonName" ? 120 : 2048)) return null;
  if ([v.teacherLessonsUrl, v.lessonUrl].some(u => typeof u === "string" && u.trim() && !safePostUrl(u))) return null;
  return { topic: (v.topic as string).trim(), sourceText: (v.sourceText as string).trim(), tone: v.tone as LessonDraft["tone"], level: v.level as LessonDraft["level"], includeCta: v.includeCta, teacherLessonsUrl: (v.teacherLessonsUrl as string).trim(), lessonUrl: (v.lessonUrl as string).trim(), lessonName: (v.lessonName as string).trim() };
}
export function parsePost(v: unknown): WowPost | null {
  if (!record(v) || !text(v.title, 1, 180) || !text(v.hook, 1, 1000) || !text(v.example, 1, 2000) || !text(v.explanation, 1, 8000)) return null;
  const q = v.interactiveQuestion;
  if (!record(q) || !text(q.question, 1, 500) || !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4 || !q.options.every(o => text(o, 1, 300)) || new Set(q.options.map(o => (o as string).trim().toLowerCase())).size !== q.options.length || !Number.isInteger(q.correctIndex) || (q.correctIndex as number) < 0 || (q.correctIndex as number) >= q.options.length || !text(q.feedback, 1, 1000)) return null;
  return { title: v.title.trim(), hook: v.hook.trim(), example: v.example.trim(), explanation: v.explanation.trim(), interactiveQuestion: { question: q.question.trim(), options: q.options.map(o => (o as string).trim()), correctIndex: q.correctIndex as number, feedback: q.feedback.trim() } };
}
/** Account identity must come from the server-verified Telegram session. */
export function resolveCta(draft: LessonDraft, username: string | null, siteUrl: string): PostCta | null {
  if (username?.toLowerCase() === "kristinaperez9") return { label: "Продолжить в EspanolReal", url: `${siteUrl}/learn` };
  if (!draft.includeCta) return null;
  if (draft.lessonUrl) return { label: `Продолжить урок${draft.lessonName ? ` «${draft.lessonName}»` : ""}`, url: safePostUrl(draft.lessonUrl)! };
  const url = safePostUrl(draft.teacherLessonsUrl);
  return url ? { label: "Уроки преподавателя", url } : null;
}
export function formatPost(post: WowPost, cta: PostCta | null): string {
  const q = post.interactiveQuestion;
  return [`🇪🇸 ${post.title}`, post.hook, `🗣️ ${post.example}`, `💡 ${post.explanation}`, `🎯 ${q.question}\n${q.options.map((o, i) => `${i + 1}. ${o}`).join("\n")}`, `Проверьте себя: ${q.correctIndex + 1}. ${q.feedback}`, ...(cta ? [`${cta.label}\n${cta.url}`] : [])].join("\n\n");
}
export const emptyDraft: LessonDraft = { topic: "", sourceText: "", tone: "conversational", level: "A1-A2", teacherLessonsUrl: "", lessonUrl: "", lessonName: "", includeCta: true };
export const postJsonSchema = {
  type: "object", additionalProperties: false,
  properties: {
    title: { type: "string" }, hook: { type: "string" }, example: { type: "string" }, explanation: { type: "string" },
    interactiveQuestion: { type: "object", additionalProperties: false, properties: { question: { type: "string" }, options: { type: "array", items: { type: "string" } }, correctIndex: { type: "integer" }, feedback: { type: "string" } }, required: ["question", "options", "correctIndex", "feedback"] },
  }, required: ["title", "hook", "example", "explanation", "interactiveQuestion"],
};
