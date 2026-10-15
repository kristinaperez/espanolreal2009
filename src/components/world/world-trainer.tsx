"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Home, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, Input } from "@/components/ui/card";
import { builtCount, emptyWorld, matchesPhrase, parseWorld, phrases, recordSuccess, WORLD_KEY, type Skill, type WorldPhrase, type WorldState } from "@/lib/world/model";
import { House } from "./house";
import { VoicePractice } from "./voice-practice";

export function WorldTrainer() {
  const [state, setState] = useState<WorldState>(emptyWorld);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      try { setState(parseWorld(localStorage.getItem(WORLD_KEY))); } catch { setStorageError(true); }
      setReady(true);
    }, 0);
    function sync(event: StorageEvent) { if (event.key === WORLD_KEY) setState(parseWorld(event.newValue)); }
    window.addEventListener("storage", sync);
    return () => { clearTimeout(timer); window.removeEventListener("storage", sync); };
  }, []);
  useEffect(() => { if (ready) heading.current?.focus(); }, [active, ready]);
  function success(id: string, skill: Skill) {
    let current = state;
    try { current = parseWorld(localStorage.getItem(WORLD_KEY)); } catch { /* Continue in memory. */ }
    // Merge positive evidence: tabs and repeated exercises must never erase progress.
    for (const phrase of phrases) for (const s of ["recognize", "respond", "recall"] as const) if (state.phrases[phrase.id]?.[s]) current = recordSuccess(current, phrase.id, s);
    const next = recordSuccess(current, id, skill);
    setState(next);
    try { localStorage.setItem(WORLD_KEY, JSON.stringify(next)); setStorageError(false); } catch { setStorageError(true); }
  }
  const count = builtCount(state);
  const next = phrases.find(p => !state.phrases[p.id]?.respond);
  const phrase = phrases.find(p => p.id === active);
  return <main lang="ru" className="world-shell space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 font-bold"><Home size={22} className="text-primary" /> EspañolReal</Link>
      <Badge>Мой первый мир · прототип</Badge>
    </header>
    {storageError && <p role="alert" className="rounded-2xl bg-danger-soft p-4 text-sm">Браузер не даёт сохранить прогресс. Сейчас он доступен только до закрытия страницы.</p>}
    {!ready ? <p role="status">Открываем твой мир…</p> : phrase ? <PhraseStep key={phrase.id} phrase={phrase} headingRef={heading} state={state} onSuccess={skill => success(phrase.id, skill)} onExit={() => setActive(null)} /> : <>
      <section className="world-hero">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Одна фраза — один шаг</p>
          <h1 ref={heading} tabIndex={-1} className="world-title">Построй свой мир на испанском</h1>
          <p className="text-lg text-muted">Начни с одной фразы. Попробуй её в разговоре — и добавь новую деталь своего дома.</p>
          <p className="font-semibold" data-testid="world-count">Твой дом: {count} из 10 деталей</p>
          <Button size="lg" onClick={() => setActive((next ?? phrases[0]).id)}>{count === 0 ? "Построить первую деталь" : count === 10 ? "Повторить фразы" : "Продолжить строительство"}<ArrowRight size={18} /></Button>
          <p className="text-sm text-muted">2–5 минут на шаг. В своём темпе, без потерянных дней.</p>
        </div>
        <div className="world-scene"><House count={count} /><p className="px-6 pb-6 text-center text-sm text-muted">{count === 10 ? "Твой первый дом готов. Ты уже сделал десять шагов!" : `Следующая деталь: ${phrases[count].reward.toLowerCase()}`}</p></div>
      </section>
      {count === 10 && <Card className="space-y-2 border-success"><h2 className="text-2xl font-bold">Дом построен!</h2><p>Десять фраз — десять новых возможностей. Возвращайся к ним, когда захочешь.</p><p className="text-sm text-muted">Окружение и следующие 20 фраз появятся на следующем этапе.</p></Card>}
      <section className="space-y-4" aria-label="Десять шагов к дому"><h2 className="text-2xl font-bold">Твои маленькие шаги</h2><div className="world-steps">{phrases.map((p, index) => {
        const done = state.phrases[p.id]?.respond, available = done || p.id === next?.id || count === 10;
        return <button key={p.id} className="world-step disabled:opacity-60" disabled={!available} aria-current={p.id === next?.id ? "step" : undefined} onClick={() => setActive(p.id)}><span className="mb-2 text-sm text-primary">{done ? "✓ Построено" : `Шаг ${index + 1}`}</span><span lang="es" className="font-bold">{p.spanish}</span><span className="mt-2 text-xs text-muted">{p.reward}</span></button>;
      })}</div></section>
      <p className="text-sm text-muted">Прогресс сохраняется в этом браузере. Старый курс доступен <Link href="/learn" className="underline">в тренажёре</Link>.</p>
    </>}
  </main>;
}

function PhraseStep({ phrase, headingRef, state, onSuccess, onExit }: { phrase: WorldPhrase; headingRef: React.RefObject<HTMLHeadingElement | null>; state: WorldState; onSuccess: (skill: Skill) => void; onExit: () => void }) {
  const [stage, setStage] = useState<"learn" | "recognize" | "respond" | "reward" | "recall">("learn");
  const [played, setPlayed] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [answer, setAnswer] = useState("");
  const title = useRef<HTMLHeadingElement>(null);
  const speech = useRef<SpeechSynthesisUtterance | null>(null);
  useEffect(() => () => { if (speech.current) { speech.current.onstart = null; speech.current.onerror = null; } window.speechSynthesis?.cancel(); }, []);
  useEffect(() => { title.current?.focus(); }, [stage]);
  function play() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) { setUnavailable(true); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase.spanish);
    speech.current = utterance;
    utterance.lang = "es-ES"; utterance.rate = .85;
    utterance.voice = window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase() === "es-es") ?? null;
    utterance.onstart = () => { setPlayed(true); setUnavailable(false); };
    utterance.onerror = () => { setUnavailable(true); setPlayed(false); };
    try { window.speechSynthesis.speak(utterance); } catch { setUnavailable(true); }
  }
  function move(value: typeof stage) { setFeedback(""); setStage(value); }
  const alternatives = [phrase, ...phrases.filter(p => p.id !== phrase.id).slice(0, 2)].sort((a,b) => a.id.localeCompare(b.id));
  const evidence = state.phrases[phrase.id];
  return <div className="world-panel space-y-6">
    <Button variant="ghost" onClick={onExit}><ArrowLeft size={18} /> К своему дому</Button>
    <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold">Шаг {phrases.indexOf(phrase) + 1} · {phrase.reward}</h1>
    <Card className="space-y-5 p-5 sm:p-8">
      <h2 ref={title} tabIndex={-1} className="text-xl font-bold">{stage === "learn" ? "Одна фраза. Уже можно сказать." : stage === "recognize" ? "Что ты услышал?" : stage === "respond" ? "Твоя очередь ответить" : stage === "recall" ? "Попробуй без подсказки" : "Ещё одна деталь — твоя!"}</h2>
      {stage === "learn" && <>
        <p lang="es" className="break-words text-3xl font-bold sm:text-4xl">{phrase.spanish}</p><p className="text-lg text-muted">{phrase.translation}</p>
        <Button variant="secondary" onClick={play}><Volume2 size={20} /> Послушать фразу</Button>
        <VoicePractice />
        <div className="space-y-4"><h3 className="font-bold">Где пригодится</h3><div className="world-situations">{phrase.situations.map(s => <div key={s.id} className="space-y-2 rounded-2xl bg-background-soft p-4"><p className="text-sm font-bold text-primary">{s.title}</p><p lang="es">— {s.cue}</p><p className="text-sm text-muted">{s.cueTranslation}</p><p lang="es" className="font-bold">— {s.reply}</p><p className="text-sm text-muted">{s.replyTranslation}</p></div>)}</div></div>
        <Button block onClick={() => { setPlayed(false); move("recognize"); }}>Попробовать<ArrowRight size={18} /></Button>
      </>}
      {stage === "recognize" && <><p className="text-muted">Нажми «Послушать» и выбери смысл фразы.</p><Button variant="secondary" onClick={play}><Volume2 size={20} /> Послушать</Button><div className="world-options">{alternatives.map(p => <button key={p.id} className="world-option" disabled={!played || unavailable} onClick={() => { if (p.id === phrase.id) { onSuccess("recognize"); move("respond"); } else setFeedback("Пока не совсем. Послушай ещё раз и попробуй снова."); }}>{p.translation}</button>)}</div><Button variant="ghost" onClick={() => move("respond")}>Продолжить без аудио</Button><p className="text-xs text-muted">Без аудио навык распознавания на слух останется непроверенным.</p></>}
      {stage === "respond" && <><p className="text-muted">{phrase.situations[0].title}. {phrase.situations[0].cueTranslation}</p><p>Как сказать: «{phrase.translation}»?</p><div className="world-options">{alternatives.map(p => <button key={p.id} lang="es" className="world-option" onClick={() => { if (p.id === phrase.id) { onSuccess("respond"); move("reward"); } else setFeedback("Попробуй другой ответ. Можно ошибаться сколько угодно."); }}>{p.spanish}</button>)}</div></>}
      {stage === "reward" && <><House count={builtCount(state)} /><p className="text-lg font-bold">{phrase.reward} — построено!</p><p>Теперь у тебя есть фраза: <span lang="es" className="font-bold">{phrase.spanish}</span></p><p className="text-sm text-muted">Повторение укрепляет навык. Построенная деталь всегда остаётся с тобой.</p><Button block onClick={onExit}>Посмотреть свой дом</Button><Button block variant="secondary" onClick={() => { setAnswer(""); move("recall"); }}>Вспомнить без подсказки</Button></>}
      {stage === "recall" && <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (matchesPhrase(answer, phrase.spanish)) { onSuccess("recall"); setFeedback("Получилось! Ты вспомнил фразу без подсказки."); } else setFeedback("Пока не совпало. Можно попробовать снова или вернуться к фразе."); }}><p>Напиши по-испански: «{phrase.translation}»</p><label className="block space-y-2"><span>Твой ответ</span><Input autoComplete="off" autoCorrect="off" spellCheck={false} lang="es" value={answer} onChange={e => setAnswer(e.target.value)} /></label><p className="text-xs text-muted">Акценты и знаки препинания можно пропустить. Здесь проверяется именно эта фраза.</p><Button type="submit" disabled={!answer.trim()}>Проверить</Button><Button type="button" variant="ghost" onClick={() => move("learn")}>Посмотреть фразу</Button><Button type="button" variant="secondary" onClick={onExit}>К своему дому</Button></form>}
      {unavailable && stage !== "reward" && <p role="status" className="text-sm text-muted">Озвучивание недоступно в этом браузере. Можно продолжить без аудио.</p>}
      <p role="status" aria-live="polite" className="font-semibold">{feedback}</p>
    </Card>
    <Card className="space-y-3"><h2 className="font-bold">Твои возможности с этой фразой</h2><p className="text-sm text-muted">Результаты упражнений на примере «{phrase.situations[0].title}». Второй диалог — пример применения, он ещё не проверен.</p>{[["recognize", "Могу узнать на слух"], ["respond", "Могу выбрать ответ"], ["recall", "Могу вспомнить без подсказки"]].map(([skill,label]) => <p key={skill} className="flex items-center gap-2 text-sm"><Check aria-hidden="true" size={18} className={evidence?.[skill as Skill] ? "text-success" : "text-muted"} />{label}: {evidence?.[skill as Skill] ? "получилось в тренировке" : "ещё не проверено"}</p>)}<p className="text-xs text-muted">Самостоятельное общение в жизни здесь не оценивается.</p></Card>
  </div>;
}
