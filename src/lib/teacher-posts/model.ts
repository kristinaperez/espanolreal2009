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
export interface CorePhrase { phrase: string; meaning: string; note: string }
export interface VisualHook {
  enabled?: boolean; variant?: "drama" | "expectation" | "deadpan"; uploadedImage?: string;
  template: "wallet" | "clock" | "memory" | "reaction";
  emotion: string; concept: string; caption: string; searchQuery: string; mediaUrl: string;
}
export interface MicroChallenge {
  kind: "quiz" | "trap" | "fill" | "reaction" | "open";
  prompt: string; options: string[]; correctIndex: number | null;
  acceptedAnswers: string[]; hint: string; feedback: string;
}
export interface WowPost {
  formatVersion?: 2;
  visual?: VisualHook;
  core?: CorePhrase[];
  challenges?: MicroChallenge[];
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
  if (v.includeCta && [v.teacherLessonsUrl, v.lessonUrl].some(u => typeof u === "string" && u.trim() && !safePostUrl(u))) return null;
  return { topic: (v.topic as string).trim(), sourceText: (v.sourceText as string).trim(), tone: v.tone as LessonDraft["tone"], level: v.level as LessonDraft["level"], includeCta: v.includeCta, teacherLessonsUrl: (v.teacherLessonsUrl as string).trim(), lessonUrl: (v.lessonUrl as string).trim(), lessonName: (v.lessonName as string).trim() };
}
export function safeUploadedImage(value: unknown): value is string {
  // Only a bounded raster JPEG produced by the upload normalizer; never SVG/HTML.
  return typeof value === "string" && value.length <= 160_000 && /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(value);
}
export function parsePost(v: unknown): WowPost | null {
  if (!record(v) || !text(v.title, 1, 180) || !text(v.hook, 1, 1000) || !text(v.example, 1, 2000) || !text(v.explanation, 1, 8000)) return null;
  const q = v.interactiveQuestion;
  if (!record(q) || !text(q.question, 1, 500) || !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4 || !q.options.every(o => text(o, 1, 300)) || new Set(q.options.map(o => (o as string).trim().toLowerCase())).size !== q.options.length || !Number.isInteger(q.correctIndex) || (q.correctIndex as number) < 0 || (q.correctIndex as number) >= q.options.length || !text(q.feedback, 1, 1000)) return null;
  const base: WowPost = { title: v.title.trim(), hook: v.hook.trim(), example: v.example.trim(), explanation: v.explanation.trim(), interactiveQuestion: { question: q.question.trim(), options: q.options.map(o => (o as string).trim()), correctIndex: q.correctIndex as number, feedback: q.feedback.trim() } };
  if (v.formatVersion === undefined) return base; // Existing published posts/drafts remain readable.
  if (v.formatVersion !== 2 || !record(v.visual) || !["wallet", "clock", "memory", "reaction"].includes(String(v.visual.template))) return null;
  const visual = v.visual;
  for (const key of ["emotion", "concept", "caption", "searchQuery"]) if (!text(visual[key], 1, key === "concept" ? 600 : 180)) return null;
  if (!text(visual.mediaUrl, 0, 2048) || (visual.mediaUrl && !safePostUrl(visual.mediaUrl))) return null;
  if (visual.enabled !== undefined && typeof visual.enabled !== "boolean") return null;
  if (visual.variant !== undefined && !["drama", "expectation", "deadpan"].includes(String(visual.variant))) return null;
  if (visual.uploadedImage !== undefined && visual.uploadedImage !== "" && !safeUploadedImage(visual.uploadedImage)) return null;
  if (visual.mediaUrl && visual.uploadedImage) return null;
  if (!Array.isArray(v.core) || v.core.length < 1 || v.core.length > 2 || !v.core.every(c => record(c) && text(c.phrase, 1, 180) && text(c.meaning, 1, 300) && text(c.note, 0, 400))) return null;
  if (!Array.isArray(v.challenges) || v.challenges.length < 4 || v.challenges.length > 5) return null;
  const challenges = v.challenges.map(parseChallenge);
  if (challenges.some(c => !c) || new Set(challenges.map(c => c!.kind)).size < 4 || challenges.at(-1)?.kind !== "open") return null;
  const first = challenges[0]!;
  if (first.kind !== "quiz" || first.prompt !== base.interactiveQuestion.question || first.correctIndex !== base.interactiveQuestion.correctIndex || JSON.stringify(first.options) !== JSON.stringify(base.interactiveQuestion.options) || first.feedback !== base.interactiveQuestion.feedback) return null;
  if (v.hook.length > 500 || v.example.length > 700 || v.explanation.length > 1800) return null;
  return { ...base, formatVersion: 2, visual: { template: visual.template as VisualHook["template"], emotion: visual.emotion as string, concept: visual.concept as string, caption: visual.caption as string, searchQuery: visual.searchQuery as string, mediaUrl: visual.mediaUrl as string, ...(visual.enabled !== undefined ? { enabled: visual.enabled as boolean } : {}), ...(visual.variant !== undefined ? { variant: visual.variant as VisualHook["variant"] } : {}), ...(typeof visual.uploadedImage === "string" ? { uploadedImage: visual.uploadedImage } : {}) }, core: v.core.map(c => ({ phrase: c.phrase.trim(), meaning: c.meaning.trim(), note: c.note.trim() })), challenges: challenges as MicroChallenge[] };
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
  if (post.formatVersion === 2 && post.challenges && post.core) {
    return [post.title, post.hook, ...(post.visual?.enabled !== false && post.visual?.mediaUrl ? [post.visual.mediaUrl] : []), post.explanation, post.example,
      post.core.map(c => `${c.phrase} — ${c.meaning}${c.note ? `\n${c.note}` : ""}`).join("\n\n"),
      "Быстрый вызов: попробуйте без подсказки 👇",
      ...post.challenges.map((c, i) => `${i + 1}. ${c.prompt}${c.options.length ? `\n${c.options.map((o, j) => `${String.fromCharCode(OPTION_LETTER_CODE + j)}) ${o}`).join("\n")}` : ""}`),
      ...(cta ? [`${cta.label}\n${cta.url}`] : [])].join("\n\n");
  }
  const q = post.interactiveQuestion;
  return [post.title, post.hook, post.example, post.explanation, `${q.question}\n${q.options.map((o, i) => `${i + 1}. ${o}`).join("\n")}`, ...(cta ? [`${cta.label}\n${cta.url}`] : [])].join("\n\n");
}
const OPTION_LETTER_CODE = 1040;
export function formatAnswerKey(post: WowPost): string {
  const tasks = post.challenges ?? [{ ...post.interactiveQuestion, prompt: post.interactiveQuestion.question, kind: "quiz", acceptedAnswers: [] }];
  return tasks.map((c, i) => `${i + 1}. ${c.kind === "open" ? "Свободный ответ" : c.correctIndex !== null ? c.options[c.correctIndex] : c.acceptedAnswers.join(" / ")}\n${c.feedback}`).join("\n\n");
}
export function parseChallenge(v: unknown): MicroChallenge | null {
  if (!record(v) || !["quiz", "trap", "fill", "reaction", "open"].includes(String(v.kind)) || !text(v.prompt, 1, 600) || !text(v.hint, 0, 300) || !text(v.feedback, 1, 600) || !Array.isArray(v.options) || !v.options.every(o => text(o, 1, 300)) || !Array.isArray(v.acceptedAnswers) || v.acceptedAnswers.length > 6 || !v.acceptedAnswers.every(a => text(a, 1, 180))) return null;
  if (["quiz", "trap", "reaction"].includes(String(v.kind))) {
    if (v.options.length < 2 || v.options.length > 4 || new Set(v.options.map(o => (o as string).trim().toLowerCase())).size !== v.options.length || !Number.isInteger(v.correctIndex) || (v.correctIndex as number) < 0 || (v.correctIndex as number) >= v.options.length || v.acceptedAnswers.length) return null;
  } else if (v.options.length || v.correctIndex !== null || (v.kind === "fill" ? !v.acceptedAnswers.length : !!v.acceptedAnswers.length)) return null;
  return { kind: v.kind as MicroChallenge["kind"], prompt: v.prompt as string, options: v.options as string[], correctIndex: v.correctIndex as number | null, acceptedAnswers: v.acceptedAnswers as string[], hint: v.hint as string, feedback: v.feedback as string };
}
export function normalizeChallengeAnswer(value: string): string {
  return value.trim().toLocaleLowerCase("es").normalize("NFC").replace(/[¿¡?!.,:;]/g, "").replace(/\s+/g, " ");
}
export function checkChallenge(task: MicroChallenge, answer: string | number): boolean | null {
  if (task.kind === "open") return null; // Personal writing is not auto-graded.
  if (task.correctIndex !== null) return typeof answer === "number" && answer === task.correctIndex;
  return typeof answer === "string" && task.acceptedAnswers.some(a => normalizeChallengeAnswer(a) === normalizeChallengeAnswer(answer));
}
export const emptyDraft: LessonDraft = { topic: "", sourceText: "", tone: "conversational", level: "A1-A2", teacherLessonsUrl: "", lessonUrl: "", lessonName: "", includeCta: true };
const stringSchema = { type: "string" };
export const postJsonSchema = {
  type: "object", additionalProperties: false,
  properties: {
    formatVersion: { type: "integer", enum: [2] },
    title: stringSchema, hook: stringSchema, example: stringSchema, explanation: stringSchema,
    visual: { type: "object", additionalProperties: false, properties: { template: { type: "string", enum: ["wallet", "clock", "memory", "reaction"] }, emotion: stringSchema, concept: stringSchema, caption: stringSchema, searchQuery: stringSchema, mediaUrl: stringSchema }, required: ["template", "emotion", "concept", "caption", "searchQuery", "mediaUrl"] },
    core: { type: "array", items: { type: "object", additionalProperties: false, properties: { phrase: stringSchema, meaning: stringSchema, note: stringSchema }, required: ["phrase", "meaning", "note"] } },
    challenges: { type: "array", items: { type: "object", additionalProperties: false, properties: { kind: { type: "string", enum: ["quiz", "trap", "fill", "reaction", "open"] }, prompt: stringSchema, options: { type: "array", items: stringSchema }, correctIndex: { type: ["integer", "null"] }, acceptedAnswers: { type: "array", items: stringSchema }, hint: stringSchema, feedback: stringSchema }, required: ["kind", "prompt", "options", "correctIndex", "acceptedAnswers", "hint", "feedback"] } },
    interactiveQuestion: { type: "object", additionalProperties: false, properties: { question: stringSchema, options: { type: "array", items: stringSchema }, correctIndex: { type: "integer" }, feedback: stringSchema }, required: ["question", "options", "correctIndex", "feedback"] },
  }, required: ["formatVersion", "title", "hook", "example", "explanation", "visual", "core", "challenges", "interactiveQuestion"],
};
