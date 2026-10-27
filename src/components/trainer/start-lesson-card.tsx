"use client";
import Image from "next/image";
import { Volume2 } from "lucide-react";
import { TelegramLogin } from "@/components/auth/telegram-login";
import { Card } from "@/components/ui/card";
import { courseConfig } from "@/lib/content/config";
import type { Lesson } from "@/lib/content/types";

/** Public teaser only: the lesson page already ships these two phrases in its HTML. */
const PREVIEW = 2;

function speak(text: string) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    /* Audio is a bonus; the card works without it. */
  }
}

function MotivationsTicker() {
  const items = courseConfig.motivations;
  return (
    <div className="er-ticker relative h-28 overflow-hidden rounded-2xl border border-line bg-background-soft" aria-label="Зачем люди учат испанский">
      <p className="absolute left-3 top-2 z-10 rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-muted">Зачем люди учат испанский</p>
      <div className="er-ticker-track px-3 pt-9 motion-reduce:animate-none">
        <ul className="space-y-2">{items.map((text) => <li key={text} className="text-sm font-semibold">«{text}»</li>)}</ul>
        <ul className="mt-2 space-y-2" aria-hidden="true">{items.map((text) => <li key={`copy-${text}`} className="text-sm font-semibold">«{text}»</li>)}</ul>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background-soft" />
      <style>{`
        .er-ticker-track { animation: er-ticker 60s linear infinite; }
        .er-ticker:hover .er-ticker-track, .er-ticker:focus-within .er-ticker-track { animation-play-state: paused; }
        @keyframes er-ticker { from { transform: translateY(0); } to { transform: translateY(-50%); } }
        @media (prefers-reduced-motion: reduce) { .er-ticker-track { animation: none; } }
      `}</style>
    </div>
  );
}

export function StartLessonCard({ lesson }: { lesson: Lesson }) {
  const phrases = lesson.phrases.slice(0, PREVIEW);
  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-end gap-3">
        <Image src="/mascot/lion.png" alt="Львёнок EspañolReal" width={120} height={125} className="h-auto w-24 shrink-0 sm:w-28" priority />
        <div className="relative mb-6 rounded-2xl border border-line bg-surface px-4 py-2 shadow-sm">
          <p className="text-lg font-black leading-tight" lang="es">¡Vamos!</p>
          <p className="text-sm text-muted">Пойдём!</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-black tracking-tight">Первый урок бесплатно</h2>
        <p className="mt-1 text-sm text-muted">Урок {lesson.lesson}: {lesson.title}. Вот две фразы из него — остальное ждёт внутри.</p>
      </div>

      <ul className="flex flex-col gap-2">
        {phrases.map((phrase) => (
          <li key={phrase.spanish} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
            <div>
              <p className="font-bold" lang="es">{phrase.spanish}</p>
              <p className="text-sm text-muted">{phrase.translation}</p>
            </div>
            <button type="button" onClick={() => speak(phrase.spanish)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label={`Послушать: ${phrase.spanish}`}>
              <Volume2 className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>

      <MotivationsTicker />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold">Начать бесплатный урок — вход через Telegram, 1 клик</p>
        <TelegramLogin />
        <p className="text-xs text-muted">Первый урок или 7 дней — что наступит раньше. Без карты.</p>
      </div>
    </Card>
  );
}
