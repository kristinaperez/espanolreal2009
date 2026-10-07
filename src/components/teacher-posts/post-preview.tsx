"use client";
import { VisualHook } from "./visual-hook";
import { ChallengeTrainer } from "./challenge-trainer";
import { useState } from "react";
import type { PostCta, WowPost } from "@/lib/teacher-posts/model";
export function PostPreview({ post, cta, headingLevel = "h2" }: { post: WowPost; cta: PostCta | null; headingLevel?: "h1" | "h2" }) {
  const [answer, setAnswer] = useState<number | null>(null);
  const q = post.interactiveQuestion;
  const Heading = headingLevel;
  return <article className="min-w-0 space-y-5 break-words rounded-2xl border border-stone-200 bg-[#FAF8F5] p-5 sm:p-6 [overflow-wrap:anywhere]">
    <p className="text-xs font-bold uppercase tracking-widest text-[#9E2A2B]">Испанский, который живёт</p>
    <Heading className="text-2xl font-extrabold leading-tight">{post.title}</Heading>
    {post.visual && post.visual.enabled !== false && <VisualHook key={`${post.visual.mediaUrl}:${post.visual.uploadedImage}:${post.visual.variant}`} plan={post.visual} />}
    <p className="whitespace-pre-wrap text-lg font-semibold">{post.hook}</p>
    <blockquote className="rounded-xl border-l-4 border-[#9E2A2B] bg-white p-4 text-lg font-bold">{post.example}</blockquote>
    <div><h3 className="mb-2 font-bold">💡 Разберёмся</h3><p className="whitespace-pre-wrap leading-7">{post.explanation}</p></div>
    {post.core && <div className="grid gap-3">{post.core.map((c, i) => <div key={i} className="rounded-xl bg-white p-4"><p className="text-lg font-extrabold text-[#9E2A2B]">{c.phrase}</p><p className="mt-1 font-semibold">{c.meaning}</p>{c.note && <p className="mt-2 text-sm text-stone-500">{c.note}</p>}</div>)}</div>}
    {post.challenges ? <ChallengeTrainer key={JSON.stringify(post.challenges)} tasks={post.challenges} /> : <fieldset className="rounded-xl border border-stone-200 bg-white p-4"><legend className="px-1 font-bold">🎯 Проверьте себя</legend><p className="mb-3 font-semibold">{q.question}</p>
      <div className="grid gap-2">{q.options.map((option, i) => <button type="button" key={i} onClick={() => setAnswer(i)} aria-pressed={answer === i} className={`min-h-11 rounded-xl border px-3 py-3 text-left text-sm ${answer === i ? "border-[#9E2A2B] bg-[#9E2A2B]/5" : "border-stone-200"}`}>{option}</button>)}</div>
      {answer !== null && <p role="status" className="mt-3 text-sm">{answer === q.correctIndex ? "Верно! " : "Попробуйте ещё раз. "}{q.feedback}</p>}
    </fieldset>}
    {cta && <a href={cta.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-[#9E2A2B] px-5 py-3 font-bold text-white">{cta.label} →</a>}
  </article>;
}
