"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/components/providers/progress-provider";
import { ExerciseRunner, type SessionResult } from "@/components/trainer/exercise-runner";
import { generatePractice, type Exercise } from "@/lib/exercises/generator";
import { localizeSituation, situationPool, type SituationLesson } from "@/lib/arabic/lessons";
import { AudioButton } from "./audio-button";
import { ArabicTrackedLink } from "./tracked-link";
import { trackArabicEvent } from "@/lib/arabic/analytics";
import { Button } from "@/components/ui/button";
const stages = ["المفردات", "الاستماع", "فهم المعنى", "إكمال العبارة", "الحوار", "موقف حقيقي"];
export function SituationTrainer({ source, nextSlug }: { source: SituationLesson; nextSlug?: string }) {
  const { state, dispatch, ready } = useProgress();
  const [stage, setStage] = useState(-1);
  const [listened, setListened] = useState(false);
  const [runDialogue, setRunDialogue] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [review, setReview] = useState(false);
  const lesson = useMemo(() => localizeSituation(source, "ar"), [source]);
  const pool = useMemo(() => situationPool("ar"), []);
  const completed = ready && state.situations.lessons[String(source.id)]?.completed;
  const reviewPhrases = lesson.phrases.map((phrase, index) => ({ phrase, index, lesson: source.id })).filter(item => (state.situations.phrases[`${source.id}:${item.index}`]?.wrong ?? 0) > 0);
  const exercises = useMemo((): Exercise[] => {
    const phrases = lesson.phrases.map((phrase, index) => ({ phrase, index, lesson: source.id }));
    if (stage === 2) return generatePractice(phrases, pool, `${source.id}-understand-${attempt}`, ["choice"]);
    if (stage === 3) return [{ id: `fill-${source.id}`, kind: "fill", lesson: source.id, phraseIndex: source.id === 1001 ? 2 : source.id === 1002 ? 1 : 0, phrase: lesson.phrases[source.id === 1001 ? 2 : source.id === 1002 ? 1 : 0], gradable: true, ...source.blank }];
    if (stage === 4) return generatePractice(phrases.slice(0, 4), pool, `${source.id}-dialogue-${attempt}`, ["build", "choice"]);
    if (stage === 5) return generatePractice([phrases[source.scenario.phraseIndex]], pool, `${source.id}-real-${attempt}`, ["build", "translate"]);
    return [];
  }, [stage, lesson, source, pool, attempt]);
  function start() { setStage(0); trackArabicEvent("arabic_lesson_start", source.slug); }
  function finishStage(result: SessionResult) {
    const nextScore = { correct: score.correct + result.correct, total: score.total + result.total };
    setScore(nextScore);
    if (stage === 5) {
      dispatch({ type: "lessonComplete", lesson: source.id, correct: nextScore.correct, total: nextScore.total, scope: "situations" });
      setDone(true);
      trackArabicEvent("arabic_lesson_complete", source.slug);
    } else setStage(value => value + 1);
  }
  if (!ready) return <p role="status">جارٍ تحميل التقدّم…</p>;
  if (review) return <section className="space-y-4"><h2 className="text-2xl font-bold">مراجعة الأخطاء</h2><ExerciseRunner key={`review-${attempt}`} exercises={generatePractice(reviewPhrases, pool, `review-${source.id}-${attempt}`, ["choice", "build"])} progressScope="situations" mode="review" title={source.title.ar} exitHref={`/ar/lesson/${source.slug}`} onFinish={() => { setReview(false); setAttempt(value => value + 1); }} /></section>;
  if (done) return <section className="space-y-5 rounded-3xl border border-line bg-surface p-6 text-center sm:p-10">
    <h2 className="text-3xl font-black">🎉 أكملت الدرس!</h2><p className="text-lg leading-8">{source.outcome.ar}</p>
    <p>الإجابات الصحيحة: <bdi dir="ltr">{score.correct} / {score.total}</bdi></p>
    <p className="text-sm text-muted">حُفظ تقدّمك على هذا الجهاز. يمكنك مراجعة العبارات التي أخطأت فيها.</p>
    <div className="flex flex-wrap justify-center gap-3">{nextSlug && <ArabicTrackedLink href={`/ar/lesson/${nextSlug}`} lessonId={nextSlug} event="arabic_next_lesson">الدرس التالي ←</ArabicTrackedLink>}<ArabicTrackedLink href="/ar/account">تسجيل الدخول عبر Telegram</ArabicTrackedLink><Button variant="secondary" onClick={() => { setDone(false); setStage(-1); setScore({ correct: 0, total: 0 }); setRunDialogue(false); setListened(false); setAttempt(value => value + 1); }}>أعد الدرس</Button></div>
    {reviewPhrases.length > 0 && <Button variant="secondary" onClick={() => setReview(true)}>راجع الأخطاء</Button>}
    <p className="text-sm text-muted">تسجيل الدخول مخصص للحساب والشراء واستعادته. لا ينقل التقدّم المحلي إلى جهاز آخر.</p>
  </section>;
  if (stage < 0) return <section className="space-y-5 rounded-3xl border border-line bg-surface p-6">
    <h2 className="text-2xl font-bold">درس تفاعلي مجاني</h2><p className="leading-8">ستتعلم الكلمات، تستمع إلى العبارة، تختار المعنى، تكمل جملة، تتدرّب على الحوار ثم تجيب عن موقف حقيقي.</p>
    {completed && <p className="font-bold text-primary">✓ سبق أن أكملت هذا الدرس على هذا الجهاز.</p>}
    <Button size="lg" onClick={start}>ابدأ الدرس</Button>{reviewPhrases.length > 0 && <Button variant="secondary" onClick={() => setReview(true)}>راجع الأخطاء السابقة</Button>}
  </section>;
  return <section className="space-y-5" aria-label="تدريب الدرس">
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3">{stages.map((label, index) => <li key={label} aria-current={stage === index ? "step" : undefined} className={`rounded-xl border p-3 text-sm font-bold ${stage === index ? "border-primary bg-primary/10 text-primary" : "border-line text-muted"}`}>{index + 1}. {label}</li>)}</ol>
    {stage === 0 && <div className="space-y-5 rounded-2xl border border-line p-5"><h2 className="text-2xl font-bold">كلمات الموقف</h2><ul className="grid gap-4 sm:grid-cols-2">{source.vocabulary.map(p => <li key={p.spanish} className="space-y-2 rounded-xl bg-background-soft p-4"><p lang="es" dir="ltr" className="font-bold">{p.spanish}</p><p>{p.translations.ar}</p><AudioButton spanish={p.spanish} lessonId={source.slug} /></li>)}</ul><Button onClick={() => { source.vocabulary.forEach((_, index) => dispatch({ type: "flashcard", lesson: source.id, phraseIndex: index, scope: "situations" })); setStage(1); }}>تابع إلى الاستماع ←</Button></div>}
    {stage === 1 && <div className="space-y-5 rounded-2xl border border-line p-6"><h2 className="text-2xl font-bold">استمع ثم كرّر</h2><p className="leading-8">استمع إلى العبارة بالإسبانية. جرّب تكرارها بصوتك، ثم انتقل إلى اختيار المعنى.</p><p lang="es" dir="ltr" className="text-2xl font-bold">{lesson.phrases[0].spanish}</p><AudioButton spanish={lesson.phrases[0].spanish} lessonId={source.slug} onPlayed={() => setListened(true)} /><Button onClick={() => setStage(2)}>{listened ? "تابع إلى فهم المعنى ←" : "تابع بالقراءة إذا تعذّر الصوت ←"}</Button></div>}
    {stage === 4 && !runDialogue && <div className="space-y-5 rounded-2xl border border-line p-6"><h2 className="text-2xl font-bold">حوار قصير</h2><ol className="space-y-4">{source.dialogue.map((line, index) => <li key={index} className="space-y-2 rounded-xl bg-background-soft p-4"><p className="text-sm text-muted">{line.speaker}</p><p lang="es" dir="ltr" className="font-bold">{line.spanish}</p><p>{line.ar}</p><AudioButton spanish={line.spanish} lessonId={source.slug} /></li>)}</ol><Button onClick={() => setRunDialogue(true)}>تدرّب على إجابات الحوار</Button></div>}
    {stage === 5 && <p className="rounded-xl bg-primary/8 p-5 text-lg leading-8" dir="auto">{source.scenario.ar}</p>}
    {(stage === 2 || stage === 3 || (stage === 4 && runDialogue) || stage === 5) && <ExerciseRunner key={`${source.id}-${stage}-${attempt}`} exercises={exercises} progressScope="situations" mode="lesson" title={source.title.ar} lessonLabel={stages[stage]} level="A0–A1" exitHref={`/ar/lesson/${source.slug}`} onFinish={finishStage} />}
    <Link href="/ar" className="block text-sm text-muted underline">العودة إلى الدروس</Link>
  </section>;
}
