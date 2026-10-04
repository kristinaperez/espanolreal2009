"use client";
import type { MicroChallenge, WowPost } from "@/lib/teacher-posts/model";
import { fieldClass } from "./fields";
export function ChallengeEditor({ post, onChange }: { post: WowPost; onChange: (post: WowPost) => void }) {
  function update(index: number, patch: Partial<MicroChallenge>) {
    const challenges = post.challenges!.map((c, i) => i === index ? { ...c, ...patch } : c);
    const first = challenges[0];
    onChange({ ...post, challenges, interactiveQuestion: { question: first.prompt, options: first.options, correctIndex: first.correctIndex!, feedback: first.feedback } });
  }
  return <div className="grid gap-5">{post.challenges!.map((c, i) => <fieldset key={i} className="grid min-w-0 gap-3 rounded-xl border border-stone-200 p-4"><legend className="px-1 text-sm font-bold">Шаг {i + 1} · {c.kind}</legend>
    <label className="text-sm font-bold">Ситуация / вопрос<textarea aria-label={`Задание ${i + 1}`} value={c.prompt} maxLength={600} rows={3} className={fieldClass} onChange={e => update(i, { prompt: e.target.value })} /></label>
    {c.options.map((option, j) => <label key={j} className="text-sm font-bold">Вариант {j + 1}<input aria-label={`Шаг ${i + 1}, вариант ${j + 1}`} value={option} maxLength={300} className={fieldClass} onChange={e => update(i, { options: c.options.map((o, k) => k === j ? e.target.value : o) })} /></label>)}
    {c.correctIndex !== null && <label className="text-sm font-bold">Правильный вариант<select value={c.correctIndex} className={fieldClass} onChange={e => update(i, { correctIndex: Number(e.target.value) })}>{c.options.map((_, j) => <option key={j} value={j}>{j + 1}</option>)}</select></label>}
    {c.kind === "fill" && <label className="text-sm font-bold">Допустимые ответы <span className="font-normal">(каждый с новой строки)</span><textarea aria-label={`Ответы шага ${i + 1}`} className={fieldClass} value={c.acceptedAnswers.join("\n")} maxLength={1080} rows={3} onChange={e => update(i, { acceptedAnswers: e.target.value.split("\n") })} /></label>}
    <label className="text-sm font-bold">Подсказка<input className={fieldClass} value={c.hint} maxLength={300} onChange={e => update(i, { hint: e.target.value })} /></label>
    <label className="text-sm font-bold">Обратная связь<textarea aria-label={`Объяснение шага ${i + 1}`} className={fieldClass} value={c.feedback} maxLength={600} rows={3} onChange={e => update(i, { feedback: e.target.value })} /></label>
    {c.kind === "open" && <p className="text-xs text-stone-500">Личная реплика не оценивается автоматически.</p>}
  </fieldset>)}</div>;
}
