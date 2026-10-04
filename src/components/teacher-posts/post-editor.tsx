"use client";
import type { WowPost } from "@/lib/teacher-posts/model";
export const fieldClass = "mt-2 w-full min-w-0 rounded-xl border border-stone-300 bg-white px-3 py-3 text-base text-stone-900 outline-none focus:border-[#9E2A2B] focus:ring-2 focus:ring-[#9E2A2B]/15";
export function PostEditor({ post, onChange }: { post: WowPost; onChange: (post: WowPost) => void }) {
  const q = post.interactiveQuestion;
  const changeQuestion = (patch: Partial<WowPost["interactiveQuestion"]>) => onChange({ ...post, interactiveQuestion: { ...q, ...patch } });
  return <div className="grid gap-4">
    {([['title', 'Заголовок', 180], ['hook', 'Хук', 1000], ['example', 'Живой пример', 2000], ['explanation', 'Разбор', 8000]] as const).map(([key, label, max]) => <label key={key} className="text-sm font-bold">{label}<textarea aria-label={label} value={post[key]} maxLength={max} rows={key === "explanation" ? 7 : 2} className={fieldClass} onChange={e => onChange({ ...post, [key]: e.target.value })} /></label>)}
    <label className="text-sm font-bold">Вопрос мини-квиза<input className={fieldClass} value={q.question} maxLength={500} onChange={e => changeQuestion({ question: e.target.value })} /></label>
    {q.options.map((option, i) => <label key={i} className="text-sm font-bold">Вариант {i + 1}<input className={fieldClass} value={option} maxLength={300} onChange={e => changeQuestion({ options: q.options.map((o, index) => index === i ? e.target.value : o) })} /></label>)}
    <label className="text-sm font-bold">Правильный ответ<select className={fieldClass} value={q.correctIndex} onChange={e => changeQuestion({ correctIndex: Number(e.target.value) })}>{q.options.map((_, i) => <option key={i} value={i}>{i + 1}</option>)}</select></label>
    <label className="text-sm font-bold">Объяснение ответа<textarea aria-label="Объяснение ответа" className={fieldClass} value={q.feedback} maxLength={1000} rows={3} onChange={e => changeQuestion({ feedback: e.target.value })} /></label>
  </div>;
}
