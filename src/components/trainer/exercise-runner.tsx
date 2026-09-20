"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Heart, RotateCcw, Sparkles, X, Zap } from "lucide-react";
import { FlipCard } from "./flip-card";
import { Badge, ProgressBar } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/components/providers/progress-provider";
import { comboBonusPercent } from "@/lib/content/config";
import type { Exercise } from "@/lib/exercises/generator";
import { answersMatch } from "@/lib/text";
import { playFeedback } from "@/lib/sound";
import { cn } from "@/lib/utils";

export interface SessionResult {
  correct: number;
  wrong: number;
  total: number;
  xpGained: number;
  mistakes: Exercise[];
}

type Mode = "lesson" | "exam" | "review";

const MODE_LABEL: Record<Mode, string> = {
  lesson: "Урок",
  exam: "Экзамен",
  review: "Повторение",
};

export function ExerciseRunner({
  exercises,
  mode,
  title,
  subtitle,
  lessonLabel,
  level,
  nextHref,
  onFinish,
}: {
  exercises: Exercise[];
  mode: Mode;
  title: string;
  subtitle?: string;
  lessonLabel?: string;
  level?: string;
  nextHref?: string;
  onFinish: (result: SessionResult) => void;
}) {
  const { state, dispatch } = useProgress();
  const [queue, setQueue] = useState<Exercise[]>(exercises);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [boolAnswer, setBoolAnswer] = useState<boolean | null>(null);
  const [input, setInput] = useState("");
  const [built, setBuilt] = useState<string[]>([]);
  const [result, setResult] = useState<null | "correct" | "wrong">(null);
  const [finished, setFinished] = useState(false);
  const startXp = useRef<number | null>(null);
  const firstAttempts = useRef<Record<string, boolean>>({});
  const mistakeIds = useRef<Set<string>>(new Set());
  const scoredRef = useRef(false);

  const total = exercises.length;
  const current = queue[index];
  const showHearts = state.settings.hearts;
  const heartsLeft = state.hearts.count;
  const outOfHearts = showHearts && heartsLeft <= 0;

  useEffect(() => {
    if (startXp.current === null) startXp.current = state.xp;
  }, [state.xp]);

  const reset = useCallback(() => {
    setSelected(null);
    setBoolAnswer(null);
    setInput("");
    setBuilt([]);
    setResult(null);
  }, []);

  const grade = useCallback(
    (correct: boolean, exercise: Exercise) => {
      if (firstAttempts.current[exercise.id] === undefined) {
        firstAttempts.current[exercise.id] = correct;
      }
      if (!correct) mistakeIds.current.add(exercise.id);
      dispatch({ type: "answer", lesson: exercise.lesson, phraseIndex: exercise.phraseIndex, correct });
      if (state.settings.sound) playFeedback(correct ? "correct" : "wrong");
      setResult(correct ? "correct" : "wrong");
    },
    [dispatch, state.settings.sound],
  );

  const submit = useCallback(() => {
    if (!current || result) return;
    switch (current.kind) {
      case "choice":
        if (selected === null) return;
        grade(selected === current.answerIndex, current);
        break;
      case "fill":
        if (selected === null) return;
        grade(selected === current.options.indexOf(current.answer), current);
        break;
      case "truefalse":
        if (boolAnswer === null) return;
        grade(boolAnswer === current.isTrue, current);
        break;
      case "build":
        if (built.length === 0) return;
        grade(answersMatch(built.join(" "), current.answer), current);
        break;
      case "translate":
        if (input.trim().length === 0) return;
        grade(answersMatch(input, current.answer), current);
        break;
      default:
        break;
    }
  }, [boolAnswer, built, current, grade, input, result, selected]);

  const next = useCallback(() => {
    const wasWrong = result === "wrong";
    const currentExercise = current;
    reset();
    if (wasWrong && currentExercise) {
      setQueue((prev) => [...prev, { ...currentExercise, id: `${currentExercise.id}#r` }]);
    }
    if (index + 1 >= (wasWrong ? queue.length + 1 : queue.length)) {
      setFinished(true);
    } else {
      setIndex((value) => value + 1);
    }
  }, [current, index, queue.length, reset, result]);

  useEffect(() => {
    if (!finished || scoredRef.current) return;
    scoredRef.current = true;
    const attempts = Object.values(firstAttempts.current);
    const correct = attempts.filter(Boolean).length;
    const wrong = attempts.length - correct;
    const gained = state.xp - (startXp.current ?? state.xp);
    const mistakes = exercises.filter((exercise) => mistakeIds.current.has(exercise.id));
    if (state.settings.sound) playFeedback("finish");
    onFinish({ correct, wrong, total: attempts.length, xpGained: gained, mistakes });
  }, [finished, exercises, onFinish, state.settings.sound, state.xp]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (result) next();
        else submit();
      }
      if (!result && /^[1-4]$/.test(event.key) && current && (current.kind === "choice" || current.kind === "fill")) {
        const optionIndex = Number(event.key) - 1;
        if (optionIndex < current.options.length) setSelected(optionIndex);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, next, result, submit]);

  const percent = useMemo(() => {
    if (total === 0) return 0;
    return Math.round((Math.min(index + 1, total) / total) * 100);
  }, [index, total]);

  if (total === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-[24px] border border-line bg-surface p-10 text-center shadow-[0_12px_40px_rgba(26,26,26,0.06)]">
        <p className="text-lg font-bold">Нет упражнений для этой сессии.</p>
        <p className="mt-2 text-sm text-muted">Загляните сюда после того, как пройдёте несколько уроков.</p>
      </div>
    );
  }

  if (finished) return null;

  if (outOfHearts) {
    return (
      <div className="mx-auto max-w-2xl rounded-[24px] border border-line bg-surface p-8 text-center shadow-[0_12px_40px_rgba(26,26,26,0.06)] sm:p-12">
        <p className="text-4xl">💔</p>
        <h2 className="mt-4 text-2xl font-black">Сердечки закончились</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Они восстанавливаются со временем. Вы можете продолжить без сердечек — режим отключается в настройках.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/learn" className="inline-flex h-12 items-center justify-center rounded-full border-2 border-line bg-surface px-6 text-sm font-extrabold transition hover:bg-background-soft active:scale-95">
            Выйти
          </Link>
          <Button size="lg" onClick={() => dispatch({ type: "setSettings", patch: { hearts: false } })}>
            Продолжить без сердечек
          </Button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const isFlashcard = current.kind === "flashcard" || current.kind === "reverse-flashcard";
  const prompt =
    current.kind === "choice"
      ? current.direction === "es-ru"
        ? current.phrase.spanish
        : current.phrase.translation
      : current.kind === "fill"
        ? current.sentence
        : current.kind === "truefalse"
          ? current.shown
          : current.kind === "build" || current.kind === "translate"
            ? current.phrase.translation
            : "";

  const canSubmit =
    current.kind === "choice" || current.kind === "fill"
      ? selected !== null
      : current.kind === "truefalse"
        ? boolAnswer !== null
        : current.kind === "build"
          ? built.length > 0
          : current.kind === "translate"
            ? input.trim().length > 0
            : false;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-8">
      {/* Figma-style exercise header */}
      <header className="sticky top-0 z-20 -mx-4 border-b border-line/70 bg-background/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href="/"
            aria-label="Вернуться на главную"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-foreground transition hover:border-primary hover:text-primary active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold">
              <span className="text-muted">{Math.min(index + 1, total)} из {total}</span>
              <span className="text-primary">+{state.combo >= 2 ? comboBonusPercent(state.combo) : 0} XP</span>
            </div>
            <ProgressBar value={percent} className="h-2.5" />
          </div>

          {showHearts ? (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-danger-soft px-3 py-2 text-sm font-extrabold text-danger">
              <Heart className="h-4 w-4 fill-current" /> {heartsLeft}
            </span>
          ) : null}
        </div>
      </header>

      <div className="px-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-extrabold text-white">
            {lessonLabel ?? MODE_LABEL[mode]}
          </span>
          <span className="rounded-full bg-background-soft px-3 py-1.5 text-xs font-extrabold text-muted">
            {level ?? (mode === "exam" ? "A1" : "A0–A1")}
          </span>
          <span className="text-sm font-bold text-muted">· {title}</span>
        </div>
        {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
      </div>

      <section key={current.id} className="animate-pop">
        {isFlashcard ? (
          <div>
            <p className="mb-3 text-center text-sm font-extrabold text-foreground">
              {current.kind === "reverse-flashcard" ? "Как сказать по-испански?" : "Что означает эта фраза?"}
            </p>
            <FlipCard
              phrase={current.phrase}
              reverse={current.kind === "reverse-flashcard"}
              index={index}
              total={total}
              difficulty={undefined}
              onKnown={() => {
                dispatch({
                  type: "flashcard",
                  lesson: current.lesson,
                  phraseIndex: current.phraseIndex,
                  reverse: current.kind === "reverse-flashcard",
                });
                next();
              }}
              onUnknown={() => {
                // «Не знал» — это самооценка флеш-карточки, а не ошибка ответа.
                // Ошибкой считаем только реально неверный ответ в упражнении.
                dispatch({
                  type: "flashcard",
                  lesson: current.lesson,
                  phraseIndex: current.phraseIndex,
                  reverse: current.kind === "reverse-flashcard",
                });
                next();
              }}
            />
          </div>
        ) : (
          <div className={cn(result === "wrong" && "animate-shake")}>
            <p className="mb-3 text-center text-sm font-extrabold text-foreground">
              {current.kind === "choice"
                ? "Выберите правильный перевод"
                : current.kind === "fill"
                  ? "Вставьте пропущенное слово"
                  : current.kind === "truefalse"
                    ? "Верный ли перевод?"
                    : current.kind === "build"
                      ? "Составьте фразу из слов"
                      : "Напишите по-испански"}
            </p>

            <div className="rounded-[24px] border border-line bg-background-soft p-6 text-center sm:p-8">
              <p className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">{prompt}</p>

              {current.kind === "truefalse" ? (
                <p className="mt-4 text-lg font-bold text-foreground">
                  = «{current.shownTranslation}»
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {current.kind === "choice" || current.kind === "fill"
                ? current.options.map((option, optionIndex) => (
                    <OptionButton
                      key={`${option}-${optionIndex}`}
                      label={option}
                      index={optionIndex}
                      disabled={Boolean(result)}
                      selected={selected === optionIndex}
                      state={
                        result
                          ? optionIndex ===
                              (current.kind === "choice"
                                ? current.answerIndex
                                : current.options.indexOf(current.answer))
                            ? "correct"
                            : selected === optionIndex
                              ? "wrong"
                              : "idle"
                          : "idle"
                      }
                      onClick={() => setSelected(optionIndex)}
                    />
                  ))
                : null}

              {current.kind === "truefalse" ? (
                <div className="grid grid-cols-2 gap-3">
                  <AnswerButton
                    icon={<X className="h-5 w-5" />}
                    label="Неверно"
                    selected={boolAnswer === false}
                    disabled={Boolean(result)}
                    correct={Boolean(result) && current.isTrue === false}
                    wrong={result === "wrong" && boolAnswer === false}
                    onClick={() => setBoolAnswer(false)}
                  />
                  <AnswerButton
                    icon={<Check className="h-5 w-5" />}
                    label="Верно"
                    selected={boolAnswer === true}
                    disabled={Boolean(result)}
                    correct={Boolean(result) && current.isTrue === true}
                    wrong={result === "wrong" && boolAnswer === true}
                    onClick={() => setBoolAnswer(true)}
                  />
                </div>
              ) : null}

              {current.kind === "build" ? (
                <>
                  <div className="min-h-20 rounded-[20px] border-2 border-dashed border-line bg-surface p-3">
                    {built.length === 0 ? (
                      <span className="text-sm text-muted">Нажимайте слова ниже…</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {built.map((token, tokenIndex) => (
                          <button
                            key={`${token}-${tokenIndex}`}
                            type="button"
                            disabled={Boolean(result)}
                            onClick={() => setBuilt((prev) => prev.filter((_, i) => i !== tokenIndex))}
                            className="rounded-full bg-primary px-4 py-2 text-sm font-extrabold text-white transition active:scale-95"
                          >
                            {token}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {current.tokens.map((token, tokenIndex) => {
                      const used = built.filter((item) => item === token).length;
                      const available = current.tokens.filter((item) => item === token).length;
                      return (
                        <button
                          key={`${token}-${tokenIndex}`}
                          type="button"
                          disabled={used >= available || Boolean(result)}
                          onClick={() => setBuilt((prev) => [...prev, token])}
                          className="rounded-full border-2 border-line bg-surface px-4 py-2 text-sm font-bold transition hover:border-primary/50 active:scale-95 disabled:opacity-30"
                        >
                          {token}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {current.kind === "translate" ? (
                <input
                  id="translation-answer"
                  name="translation-answer"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={Boolean(result)}
                  placeholder="Escribe en español…"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="mt-1 h-14 w-full rounded-2xl border-2 border-line bg-surface px-4 text-lg font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              ) : null}
            </div>
          </div>
        )}
      </section>

      {result && current.gradable ? (
        <div
          className={cn(
            "animate-fade-up rounded-[20px] border-2 p-5",
            result === "correct" ? "border-success/30 bg-success-soft" : "border-danger/30 bg-danger-soft",
          )}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/70">
              {result === "correct" ? <Check className="h-5 w-5 text-success" /> : <Sparkles className="h-5 w-5 text-danger" />}
            </span>
            <div className="min-w-0">
              <p className={cn("text-base font-black", result === "correct" ? "text-success" : "text-danger")}>
                {result === "correct" ? "🎉 Отлично!" : "💡 Почти!"}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {current.kind === "build" || current.kind === "translate" ? current.answer : current.phrase.spanish}
                {" — "}
                {current.phrase.translation}
              </p>
              {result === "wrong" ? (
                <p className="mt-2 text-xs font-bold text-muted">Мы повторим эту фразу позже 🔄</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {!isFlashcard ? (
        <Button
          size="lg"
          block
          onClick={result ? next : submit}
          disabled={!result && !canSubmit}
          className="h-14 rounded-full text-base font-extrabold shadow-[0_4px_0_0_var(--primary-strong)] transition active:scale-95"
        >
          {result ? (index + 1 >= queue.length ? "Завершить урок" : "Далее →") : "Проверить"}
        </Button>
      ) : null}

      {nextHref ? (
        <p className="flex items-center justify-center gap-1 text-xs text-muted">
          <RotateCcw className="h-3.5 w-3.5" /> Ошибки возвращаются в повторение автоматически
        </p>
      ) : null}
    </div>
  );
}

function OptionButton({
  label,
  index,
  selected,
  state,
  disabled,
  onClick,
}: {
  label: string;
  index: number;
  selected: boolean;
  state: "idle" | "correct" | "wrong";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-[18px] border-2 bg-surface px-4 py-3 text-left text-[15px] font-bold transition hover:border-primary/50 active:scale-[0.98]",
        state === "correct" && "border-success bg-success-soft text-success",
        state === "wrong" && "border-danger bg-danger-soft text-danger",
        state === "idle" && selected && "border-primary bg-primary/10",
        state === "idle" && !selected && "border-line",
        disabled && state === "idle" && !selected && "opacity-55",
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black",
          state === "correct" ? "bg-success text-white" :
          state === "wrong" ? "bg-danger text-white" :
          selected ? "bg-primary text-white" : "bg-background-soft text-muted",
        )}
      >
        {index + 1}
      </span>
      <span className="leading-snug">{label}</span>
    </button>
  );
}

function AnswerButton({
  icon,
  label,
  selected,
  disabled,
  correct,
  wrong,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  disabled: boolean;
  correct: boolean;
  wrong: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-14 items-center justify-center gap-2 rounded-full border-2 bg-surface text-sm font-extrabold transition hover:border-primary/50 active:scale-95",
        selected && "border-primary bg-primary/10",
        correct && "border-success bg-success-soft text-success",
        wrong && "animate-shake border-danger bg-danger-soft text-danger",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
