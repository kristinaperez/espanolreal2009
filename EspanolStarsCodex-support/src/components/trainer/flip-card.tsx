"use client";

import { useState } from "react";
import type { LessonPhrase } from "@/lib/content/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

interface FlipCardProps {
  phrase: LessonPhrase;
  reverse: boolean;
  index: number;
  total: number;
  onKnown: () => void;
  /** Called when the learner marks the phrase as not known. */
  onUnknown?: () => void;
  difficulty?: string;
}

export function FlipCard({
  phrase,
  reverse,
  index,
  total,
  onKnown,
  onUnknown,
  difficulty,
}: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const { language } = useLanguage();
  const fr = language === "fr";

  const front = reverse ? phrase.translation : phrase.spanish;
  const back = reverse ? phrase.spanish : phrase.translation;

  return (
    <div>
      <div className="flip">
        <button
          type="button"
          onClick={() => {
            setFlipped(true);
            setRevealed(true);
          }}
          className={cn("flip w-full text-left", flipped && "is-flipped")}
          aria-label={fr ? "Afficher la traduction" : "Показать перевод"}
        >
          <div className="flip-inner min-h-[270px]">
            <div className="flip-face flex min-h-[270px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-line bg-background-soft p-7 text-center transition hover:border-primary/40 sm:p-10">
              <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-muted">
                {reverse ? (fr ? "Comment le dire en espagnol ?" : "Как сказать по-испански?") : (fr ? "Que signifie cette phrase ?" : "Что означает эта фраза?")}
              </span>
              <p className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{front}</p>
              <span className="mt-7 rounded-full bg-surface px-4 py-2 text-xs font-bold text-muted shadow-sm">
                {fr ? "Cliquez pour retourner la carte ↻" : "Нажмите, чтобы перевернуть ↻"}
              </span>
            </div>

            <div className="flip-back flip-face flex min-h-[270px] flex-col items-center justify-center rounded-[24px] border-2 border-primary/40 bg-primary/5 p-7 text-center sm:p-10">
              <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
                {reverse ? "Español" : fr ? "Traduction" : "Перевод"}
              </span>
              <p className="mt-5 text-3xl font-black leading-tight tracking-tight text-primary sm:text-4xl">{back}</p>
              {phrase.example ? (
                <p className="mt-5 max-w-xl text-sm leading-6 text-muted">
                  <span className="font-bold text-foreground">{phrase.example}</span>
                  {phrase.exampleTranslation ? ` — ${phrase.exampleTranslation}` : ""}
                </p>
              ) : null}
            </div>
          </div>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          size="lg"
          block
          onClick={() => {
            if (onUnknown) onUnknown();
            setFlipped(false);
            setRevealed(false);
          }}
          className="h-14 rounded-full border-2 font-extrabold active:scale-95"
        >
          😕 {fr ? "Je ne savais pas" : "Не знал"}
        </Button>
        <Button
          variant="primary"
          size="lg"
          block
          disabled={!revealed}
          onClick={() => {
            onKnown();
            setFlipped(false);
            setRevealed(false);
          }}
          className="h-14 rounded-full font-extrabold shadow-[0_4px_0_0_var(--primary-strong)] active:scale-95"
        >
          ✓ {fr ? "Je savais" : "Знал"}
        </Button>
      </div>

      {difficulty ? <p className="mt-3 text-center text-xs text-muted">{difficulty} · {index + 1} {fr ? "sur" : "из"} {total}</p> : null}
    </div>
  );
}
