"use client";
import { ChallengeEditor } from "./challenge-editor";
import type { WowPost } from "@/lib/teacher-posts/model";
import { fieldClass } from "./fields";
export { fieldClass } from "./fields";
export function PostEditor({ post, onChange }: { post: WowPost; onChange: (post: WowPost) => void }) {
  const q = post.interactiveQuestion;
  const changeQuestion = (patch: Partial<WowPost["interactiveQuestion"]>) => onChange({ ...post, interactiveQuestion: { ...q, ...patch } });
  return <div className="grid gap-4">
    {([['title', 'Заголовок', 180], ['hook', 'Хук (Catch)', post.formatVersion === 2 ? 500 : 1000], ['example', 'Живой пример', post.formatVersion === 2 ? 700 : 2000], ['explanation', 'История / контекст', post.formatVersion === 2 ? 1800 : 8000]] as const).map(([key, label, max]) => <label key={key} className="text-sm font-bold">{label}<textarea aria-label={label} value={post[key]} maxLength={max} rows={key === "explanation" ? 7 : 2} className={fieldClass} onChange={e => onChange({ ...post, [key]: e.target.value })} /></label>)}
    {post.visual && <fieldset className="grid min-w-0 gap-4 rounded-xl border p-4"><legend className="px-1 font-bold">Визуальный хук</legend>{([['emotion', 'Чувство'], ['concept', 'Сценарий мема'], ['caption', 'Подпись на меме'], ['searchQuery', 'Поисковая идея']] as const).map(([key, label]) => <label key={key} className="text-sm font-bold">{label}<textarea aria-label={label} className={fieldClass} value={post.visual![key]} maxLength={key === "concept" ? 600 : 180} rows={2} onChange={e => onChange({ ...post, visual: { ...post.visual!, [key]: e.target.value } })} /></label>)}</fieldset>}
    {post.core && <fieldset className="grid min-w-0 gap-4 rounded-xl border p-4"><legend className="px-1 font-bold">1–2 фразы (Core)</legend>{post.core.map((c, i) => <div key={i} className="grid gap-3">{([['phrase', 'Фраза', 180], ['meaning', 'Перевод', 300], ['note', 'Короткая заметка', 400]] as const).map(([key, label, max]) => <label key={key} className="text-sm font-bold">{label} {i + 1}<input aria-label={`${label} ${i + 1}`} value={c[key]} maxLength={max} className={fieldClass} onChange={e => onChange({ ...post, core: post.core!.map((item, j) => i === j ? { ...item, [key]: e.target.value } : item) })} /></label>)}</div>)}</fieldset>}
    {post.challenges ? <ChallengeEditor post={post} onChange={onChange} /> : <>
    <label className="text-sm font-bold">Вопрос мини-квиза<input className={fieldClass} value={q.question} maxLength={500} onChange={e => changeQuestion({ question: e.target.value })} /></label>
    {q.options.map((option, i) => <label key={i} className="text-sm font-bold">Вариант {i + 1}<input className={fieldClass} value={option} maxLength={300} onChange={e => changeQuestion({ options: q.options.map((o, index) => index === i ? e.target.value : o) })} /></label>)}
    <label className="text-sm font-bold">Правильный ответ<select className={fieldClass} value={q.correctIndex} onChange={e => changeQuestion({ correctIndex: Number(e.target.value) })}>{q.options.map((_, i) => <option key={i} value={i}>{i + 1}</option>)}</select></label>
    <label className="text-sm font-bold">Объяснение ответа<textarea aria-label="Объяснение ответа" className={fieldClass} value={q.feedback} maxLength={1000} rows={3} onChange={e => changeQuestion({ feedback: e.target.value })} /></label>
    </>}
  </div>;
}
