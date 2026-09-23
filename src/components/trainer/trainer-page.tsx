"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, GraduationCap, Loader2, Sparkles } from "lucide-react";
import { ExerciseRunner, type SessionResult } from "./exercise-runner";
import { PremiumLock, SessionSummary } from "./session-summary";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { useProgress } from "@/components/providers/progress-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { categoryById, course } from "@/lib/content/config";
import type { Distractor, Lesson } from "@/lib/content/types";
import { buildExamSession, buildLessonSession } from "@/lib/exercises/generator";
import { frenchDemoPool, localizeLessonForFrench } from "@/lib/content/french-demo";
import { useLanguage } from "@/components/providers/language-provider";

type Phase = "intro" | "run" | "done";

interface LessonPayload {
  lesson: Lesson;
  pool: Distractor[];
}

/**
 * Trainer shell. Shared by lessons, exams and the landing demo.
 *
 * `protectedContent` means the server withheld the premium phrases: they are
 * fetched from `/api/lessons/[n]` only after an entitlement is confirmed
 * (a Telegram account with a server-confirmed paid order).
 */
export function TrainerPage({
  mode,
  lessons,
  pool,
  nextHref,
  reviewHref,
  blockNumber,
  protectedContent = false,
}: {
  mode: "lesson" | "exam";
  lessons: Lesson[];
  pool: Distractor[];
  nextHref?: string;
  reviewHref?: string;
  blockNumber?: number;
  protectedContent?: boolean;
}) {
  const { state, dispatch, access } = useProgress();
  const { serverPremium } = useAuth();
  const { language } = useLanguage();
  const fr = language === "fr";
  const [phase, setPhase] = useState<Phase>("intro");
  const [result, setResult] = useState<SessionResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [payloads, setPayloads] = useState<LessonPayload[] | null>(
    protectedContent ? null : lessons.map((lesson) => ({ lesson, pool })),
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const primary = lessons[0];
  const accessLesson = mode === "exam" ? lessons[lessons.length - 1].lesson : primary.lesson;
  // Access is granted by the server session, except for an intentional static distribution.
  // Deliberately independent of hydration state so SSR and the first client
  // render agree: locked lessons never leak their phrases.
  const entitled = access(accessLesson) || serverPremium;
  const locked = !entitled;

  const loadProtected = useCallback(async () => {
    if (!protectedContent || payloads || locked) return;
    setLoadError(null);
    const responses = await Promise.all(
      lessons.map(async (lesson) => {
        try {
          const response = await fetch(`/api/lessons/${lesson.lesson}`, {
            cache: "no-store",
            credentials: "same-origin",
          });
          if (!response.ok) return null;
          return (await response.json()) as LessonPayload;
        } catch {
          return null;
        }
      }),
    );
    if (responses.some((item) => !item)) {
      setLoadError(fr ? "Impossible de charger la leçon. Vérifiez votre connexion ou connectez-vous avec Telegram pour restaurer votre achat." : "Не удалось загрузить урок. Проверьте подключение к интернету или войдите через Telegram, чтобы восстановить покупку.");
      return;
    }
    setPayloads(responses as LessonPayload[]);
  }, [fr, lessons, locked, payloads, protectedContent]);

  useEffect(() => {
    if (!protectedContent || locked) return;
    if (payloads) return;
    void loadProtected();
  }, [loadProtected, locked, payloads, protectedContent]);

  const activeLessons = useMemo(
    () => (payloads ? payloads.map((item) => item.lesson) : lessons),
    [lessons, payloads],
  );
  const activePool = useMemo(
    () =>
      payloads && payloads.length > 0 && payloads[0].pool.length > 0
        ? payloads[0].pool
        : pool,
    [payloads, pool],
  );
  const frenchDemo = fr && mode === "lesson" && activeLessons.length === 1 && activeLessons[0].lesson <= 2;
  // The French prototype deliberately stops after lesson 2: it must not send
  // a demonstration visitor into untranslated lesson 3.
  const visibleNextHref = frenchDemo && primary.lesson === 2 ? undefined : nextHref;
  const displayLessons = useMemo(
    () => (frenchDemo ? activeLessons.map(localizeLessonForFrench) : activeLessons),
    [activeLessons, frenchDemo],
  );
  const displayPool = useMemo(
    () => (frenchDemo ? frenchDemoPool(activeLessons[0].lesson) : activePool),
    [activeLessons, activePool, frenchDemo],
  );

  const session = useMemo(() => {
    if (mode === "exam") {
      return buildExamSession(displayLessons, displayPool, `exam-${blockNumber}-${attempt}`, course.examQuestionCount);
    }
    return buildLessonSession(displayLessons[0], displayPool, String(attempt));
  }, [attempt, blockNumber, displayLessons, displayPool, mode]);

  const progress = state.lessons[String(primary.lesson)];
  const category = categoryById.get(primary.category);

  const finish = (payload: SessionResult) => {
    if (mode === "exam" && blockNumber) {
      dispatch({ type: "examComplete", block: blockNumber, correct: payload.correct, total: payload.total });
    } else {
      dispatch({ type: "lessonComplete", lesson: primary.lesson, correct: payload.correct, total: payload.total });
    }
    setResult(payload);
    setPhase("done");
  };

  if (locked) {
    return <PremiumLock />;
  }

  if (protectedContent && !payloads) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          {loadError ? (
            <>
              <span className="text-4xl">📡</span>
              <p className="text-lg font-bold">{fr ? "La leçon n'a pas pu être chargée" : "Урок не загрузился"}</p>
              <p className="max-w-md text-sm text-muted">{loadError}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                <Button size="lg" onClick={() => void loadProtected()}>
                  {fr ? "Réessayer" : "Попробовать снова"}
                </Button>
                <Link
                  href="/learn/settings#premium"
                  className="inline-flex h-14 items-center justify-center rounded-2xl border border-line bg-surface px-7 text-base font-semibold"
                >
                  {fr ? "Restaurer l'achat" : "Восстановить покупку"}
                </Link>
              </div>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-base font-bold">{fr ? "Chargement de la leçon…" : "Загружаем урок…"}</p>
              <p className="text-sm text-muted">{fr ? "Le contenu Premium se charge après vérification de l'accès." : "Premium-контент подгружается после проверки доступа."}</p>
            </>
          )}
        </Card>
      </div>
    );
  }

  if (phase === "run") {
    return (
      <ExerciseRunner
        key={`${mode}-${attempt}`}
        exercises={session.exercises}
        mode={mode}
        title={mode === "exam" ? `${fr ? "Examen" : "Экзамен"} ${blockNumber}` : displayLessons[0].title}
        subtitle={mode === "exam" ? (fr ? "Vérification des connaissances du bloc de leçons" : "Проверка знаний по блоку уроков") : displayLessons[0].subtitle}
        lessonLabel={mode === "exam" ? (fr ? "Examen" : "Экзамен") : fr ? "Vie quotidienne" : category?.labelRu ?? primary.category}
        level={primary.difficulty}
        onFinish={finish}
      />
    );
  }

  if (phase === "done" && result) {
    return (
      <SessionSummary
        result={result}
        title={mode === "exam" ? (fr ? "Examen réussi !" : "Экзамен сдан!") : (fr ? "Leçon terminée !" : "Урок пройден!")}
        nextHref={visibleNextHref}
        retryHref={mode === "lesson" ? `/lesson/${primary.lesson}` : blockNumber ? `/exam/${blockNumber}` : undefined}
        reviewHref="/learn/review"
      />
    );
  }

  const fullLesson = displayLessons[0];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">
            {mode === "exam" ? `${fr ? "Examen" : "Экзамен"} ${blockNumber}` : `${fr ? "Leçon" : "Урок"} ${primary.lesson}`}
          </Badge>
          <Badge>
            {category?.emoji} {fr ? "Vie quotidienne" : category?.labelRu ?? primary.category}
          </Badge>
          <Badge tone="accent">{primary.difficulty}</Badge>
          <Badge>{fullLesson.phrases.length} {fr ? "phrases" : "фраз"}</Badge>
          {progress?.completed ? <Badge tone="success">✓ {fr ? "terminée" : "пройден"}</Badge> : null}
          {serverPremium || process.env.NEXT_PUBLIC_STATIC_EXPORT === "true" ? (
            <Badge tone="info">Premium</Badge>
          ) : null}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{fullLesson.title}</h1>
        {fullLesson.subtitle ? <p className="text-base text-muted">{fullLesson.subtitle}</p> : null}
        {fullLesson.summary ? <p className="max-w-2xl text-base">{fullLesson.summary}</p> : null}
      </header>

      {fullLesson.authorComment ? (
        <Card className="border-primary/30 bg-primary/8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="h-4 w-4" /> {fr ? "Note de l'auteur" : "Комментарий автора"}
          </p>
          <p className="mt-2 text-[15px] font-medium leading-relaxed">{fullLesson.authorComment}</p>
        </Card>
      ) : null}

      <Card>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
          <BookOpen className="h-4 w-4" /> {fr ? "Phrases de la leçon" : "Фразы урока"}
        </p>
        <ul className="mt-4 flex flex-col divide-y divide-line">
          {fullLesson.phrases.map((phrase) => (
            <li key={phrase.spanish} className="py-3">
              <p className="text-lg font-bold tracking-tight">{phrase.spanish}</p>
              <p className="text-sm text-muted">{phrase.translation}</p>
              {phrase.example ? (
                <p className="mt-1 text-sm text-muted">
                  <span className="font-semibold text-foreground">{phrase.example}</span>
                  {phrase.exampleTranslation ? ` — ${phrase.exampleTranslation}` : ""}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        {mode === "exam" ? (
          <p className="mt-4 text-sm text-muted">
            {fr ? "L'examen inclut les phrases des leçons" : "В экзамен входят фразы из уроков"} {displayLessons.map((item) => item.lesson).join(", ")}.
          </p>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-bold">
            {mode === "exam" ? `${course.examQuestionCount} ${fr ? "questions" : "вопросов"}` : fr ? "Cartes · pratique · mini-test" : "Карточки · практика · мини-тест"}
          </p>
          <p className="text-sm text-muted">{fr ? "Les erreurs sont ajoutées automatiquement au plan de révision." : "Ошибки автоматически попадают в план повторения."}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              setAttempt((value) => value + 1);
              setPhase("run");
            }}
          >
            <GraduationCap className="h-5 w-5" /> {fr ? "Encore une fois" : "Ещё раз"}
          </Button>
          <Button size="lg" onClick={() => setPhase("run")}>
            {fr ? "Commencer" : "Начать"} <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      {visibleNextHref ? (
        <p className="text-sm text-muted">
          {fr ? "Ensuite :" : "Дальше:"}{" "}
          <Link href={visibleNextHref} className="font-bold text-primary underline decoration-primary/40">
            {fr ? "la leçon suivante" : "следующий урок"}
          </Link>{" "}
          ·{" "}
          <Link href={reviewHref ?? "/learn/review"} className="font-bold text-primary underline decoration-primary/40">
            {fr ? "révisions" : "повторение"}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
