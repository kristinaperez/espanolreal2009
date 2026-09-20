"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Confetti } from "@/components/ui/confetti";
import { Badge, Card, ProgressBar } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useProgress } from "@/components/providers/progress-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { TelegramLogin } from "@/components/auth/telegram-login";
import { TelegramStarsPayment } from "@/components/payments/telegram-stars";
import { levelFromXp, levelProgress } from "@/lib/content/config";
import type { SessionResult } from "./exercise-runner";

export function SessionSummary({
  result,
  title,
  nextHref,
  retryHref,
  reviewHref,
}: {
  result: SessionResult;
  title: string;
  nextHref?: string;
  retryHref?: string;
  reviewHref?: string;
}) {
  const { state } = useProgress();
  const score = result.total === 0 ? 0 : Math.round((result.correct / result.total) * 100);
  const currentLevel = levelFromXp(state.xp).level;
  const progress = levelProgress(state.xp);

  return (
    <div className="mx-auto max-w-2xl animate-pop pb-8">
      <div className="relative overflow-hidden rounded-[28px] border border-line bg-surface p-6 text-center shadow-[0_16px_55px_rgba(26,26,26,0.08)] sm:p-10">
        <Confetti active={score >= 60} />

        <div className="relative">
          <div className="mx-auto grid h-20 w-20 animate-float place-items-center rounded-full bg-primary/10 text-5xl">
            🎉
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
            {title === "Урок пройден!" ? "Урок завершён!" : title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {score === 100
              ? "Идеально! Все ответы верные 🎯"
              : score >= 80
                ? "Отличная работа! Продолжайте в том же духе."
                : "Ошибки — часть обучения. Мы вернём эти фразы в повторение."}
          </p>

          <div className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-3">
            <Stat icon="⭐" label="XP" value={`+${result.xpGained}`} />
            <Stat icon="🎯" label="Точность" value={`${score}%`} />
            <Stat icon="🔄" label="Ошибки" value={`${result.wrong}`} />
          </div>

          {result.mistakes.length > 0 ? (
            <div className="mx-auto mt-6 max-w-xl rounded-[20px] border border-amber-300/70 bg-amber-50 p-5 text-left dark:border-amber-500/30 dark:bg-amber-950/20">
              <p className="font-black text-amber-800 dark:text-amber-300">
                🔄 Фразы отправлены в повторение
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800/80 dark:text-amber-200/80">
                Мы повторим их позже — следующая проверка начнётся примерно через 1 день.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {result.mistakes.slice(0, 4).map((exercise) => (
                  <li key={exercise.id}>
                    <span className="font-bold">{exercise.phrase.spanish}</span>
                    <span className="text-muted"> — {exercise.phrase.translation}</span>
                  </li>
                ))}
              </ul>
              {reviewHref ? (
                <Link href={reviewHref} className="mt-3 inline-flex text-sm font-extrabold text-primary hover:underline">
                  Открыть повторение →
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="mx-auto mt-7 max-w-xl rounded-[20px] bg-background-soft p-4 text-left">
            <div className="mb-2 flex items-center justify-between text-xs font-bold">
              <span>Уровень {currentLevel} · {levelFromXp(state.xp).name}</span>
              <span className="text-muted">{progress.xpToNext} XP до следующего</span>
            </div>
            <ProgressBar value={progress.percent} tone="accent" />
          </div>

          <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3">
            {nextHref ? (
              <Link
                href={nextHref}
                className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-7 text-base font-extrabold text-white shadow-[0_4px_0_0_var(--primary-strong)] transition hover:bg-primary-strong active:scale-95"
              >
                Продолжить курс →
              </Link>
            ) : retryHref ? (
              <Link
                href={retryHref}
                className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-7 text-base font-extrabold text-white shadow-[0_4px_0_0_var(--primary-strong)] transition hover:bg-primary-strong active:scale-95"
              >
                Пройти ещё раз
              </Link>
            ) : null}

            <Link
              href="/"
              className="inline-flex h-14 items-center justify-center rounded-full border-2 border-line bg-surface px-7 text-base font-extrabold transition hover:border-primary hover:text-primary active:scale-95"
            >
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-background-soft px-3 py-4">
      <div className="text-xl">{icon}</div>
      <p className="mt-1 text-2xl font-black leading-none">{value}</p>
      <p className="mt-1 text-xs font-bold text-muted">{label}</p>
    </div>
  );
}

export function PremiumLock({ nextLesson }: { nextLesson?: number }) {
  const { premium } = useProgress();
  const { starsPrice, user } = useAuth();
  const [showPayment, setShowPayment] = useState(false);

  return (
    <div className="flex flex-col gap-5 rounded-[28px] border-2 border-primary/30 bg-primary/8 p-6 text-center sm:p-10">
      <div>
        <p className="text-5xl">🔒</p>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Вы прошли бесплатную часть курса
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted">
          Откройте все уроки, полную систему повторения, экзамены и сертификат. Разовая оплата{" "}
          <span className="font-bold text-foreground">{starsPrice} ⭐</span> в Telegram — без подписки и
          автоплатежей.
        </p>
      </div>

      <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        {premium ? (
          <Link
            href="/learn/settings#premium"
            className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-7 text-base font-extrabold text-white shadow-[0_4px_0_0_var(--primary-strong)] active:scale-95"
          >
            Управление доступом
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setShowPayment((value) => !value)}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-extrabold text-white shadow-[0_4px_0_0_var(--primary-strong)] active:scale-95"
          >
            <Star className="h-5 w-5" /> Разблокировать за {starsPrice} ⭐
          </button>
        )}
      </div>

      {showPayment && !premium ? (
        <div className="mx-auto max-w-xl text-left">
          <Card className="bg-surface">
            {user ? (
              <TelegramStarsPayment compact />
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold">Войдите через Telegram, чтобы оплатить</p>
                <TelegramLogin variant="compact" />
              </div>
            )}
          </Card>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-2">
        <Badge tone="success">Без подписки</Badge>
        <Badge tone="info">Все будущие уроки</Badge>
        <Badge tone="accent">Бессрочный доступ</Badge>
      </div>
    </div>
  );
}
