"use client";
import { useState } from "react";
import { checkChallenge, type MicroChallenge } from "@/lib/teacher-posts/model";
import { fieldClass } from "./fields";
const names: Record<MicroChallenge["kind"], string> = { quiz: "Доверься интуиции", trap: "Поймай подвох", fill: "Эмодзи-декодер", reaction: "Твоя реакция", open: "Твоя история" };
export function ChallengeTrainer({ tasks }: { tasks: MicroChallenge[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(string | number | undefined)[]>([]);
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const task = tasks[step];
  const completed = step >= tasks.length;
  const answer = answers[step];
  const scored = tasks.filter(t => t.kind !== "open").length;
  const score = tasks.filter((t, i) => t.kind !== "open" && checkChallenge(t, answers[i] ?? "") === true).length;
  const result = task && answer !== undefined ? checkChallenge(task, answer) : null;
  function setAnswer(value: string | number) {
    setAnswers(current => tasks.map((_, i) => i === step ? value : current[i]));
    setChecked(task.kind !== "fill" && task.kind !== "open");
  }
  return <section aria-label="Тренажёр WOW-поста" className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
    <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-bold">Быстрый вызов</h3><span className="text-xs font-bold text-[#9E2A2B]">{completed ? "Готово" : `${step + 1} / ${tasks.length}`}</span></div>
    <div className="mb-5 flex gap-1.5" aria-hidden>{tasks.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#9E2A2B]" : "bg-stone-100"}`} />)}</div>
    {completed ? <div role="status"><p className="text-lg font-bold">{score} из {scored} проверяемых заданий</p><p className="mt-2 text-sm text-stone-600">Своя реплика — отдельный шаг: мы не ставим ей автоматическую оценку. Возьмите одну фразу в следующий разговор.</p><button type="button" className="mt-4 min-h-11 rounded-xl border px-4 font-bold" onClick={() => { setStep(0); setAnswers([]); setChecked(false); setHint(false); }}>Попробовать ещё раз</button></div> : <>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">{names[task.kind]}</p>
      <p className="mb-4 whitespace-pre-wrap font-semibold">{task.prompt}</p>
      {task.options.length ? <div className="grid gap-2">{task.options.map((option, i) => <button type="button" key={i} aria-pressed={answer === i} onClick={() => setAnswer(i)} className={`min-h-11 rounded-xl border px-3 py-3 text-left text-sm ${answer === i ? "border-[#9E2A2B] bg-[#9E2A2B]/5" : "border-stone-200"}`}>{option}</button>)}</div> : <label className="text-sm font-semibold">{task.kind === "open" ? "Ваша реплика" : "Ваш ответ"}{task.kind === "open" ? <textarea value={String(answer ?? "")} maxLength={600} rows={3} className={fieldClass} onChange={e => setAnswer(e.target.value)} /> : <input value={String(answer ?? "")} maxLength={180} className={fieldClass} onChange={e => setAnswer(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && String(answer ?? "").trim()) { e.preventDefault(); setChecked(true); } }} />}</label>}
      {task.kind === "fill" && <button type="button" disabled={!String(answer ?? "").trim()} onClick={() => setChecked(true)} className="mt-3 min-h-11 rounded-xl border px-4 font-bold disabled:opacity-50">Проверить ответ</button>}
      {task.hint && <button type="button" className="mt-3 block min-h-11 text-sm font-semibold text-[#9E2A2B]" onClick={() => setHint(!hint)}>{hint ? "Скрыть подсказку" : "Подсказка"}</button>}
      {hint && <p className="mb-3 text-sm text-stone-500">{task.hint}</p>}
      {checked && <p role="status" className={`mt-3 rounded-xl p-3 text-sm ${result ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>{result ? "Верно! " : "Попробуйте ещё раз. "}{task.feedback}</p>}
      <button type="button" disabled={task.kind === "open" ? !String(answer ?? "").trim() : !checked} onClick={() => { setStep(step + 1); setChecked(false); setHint(false); }} className="mt-4 min-h-11 w-full rounded-full bg-[#9E2A2B] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{step === tasks.length - 1 ? "Завершить вызов" : "Следующее задание →"}</button>
    </>}
  </section>;
}
