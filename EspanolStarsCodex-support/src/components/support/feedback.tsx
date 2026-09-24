"use client";

import { useEffect, useMemo, useState } from "react";
import { Bug, CheckCircle2, CircleHelp, ExternalLink, Lightbulb, MessageCircle, Send, X } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export type FeedbackType = "bug" | "idea" | "question";

export interface FeedbackContext {
  lesson?: number;
  card?: number;
  phrase?: string;
  translation?: string;
  exerciseKind?: string;
}

const SUPPORT_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_BOT_USERNAME?.replace(/^@/, "") || "EspanolRealSupportBot";

const TYPE_META: Record<FeedbackType, { icon: typeof Bug; emoji: string; ru: string; fr: string }> = {
  bug: { icon: Bug, emoji: "🐛", ru: "Нашёл ошибку", fr: "Signaler une erreur" },
  idea: { icon: Lightbulb, emoji: "💡", ru: "Есть идея", fr: "J’ai une idée" },
  question: { icon: CircleHelp, emoji: "❓", ru: "Нужна помощь", fr: "J’ai une question" },
};

const ISSUE_REASONS = [
  { value: "translation", ru: "Неправильный перевод", fr: "Traduction incorrecte" },
  { value: "spanish", ru: "Ошибка в испанском", fr: "Erreur en espagnol" },
  { value: "pronunciation", ru: "Неправильное произношение", fr: "Prononciation incorrecte" },
  { value: "other", ru: "Другое", fr: "Autre" },
] as const;

export function FeedbackButton({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { language } = useLanguage();
  const fr = language === "fr";
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl border border-line bg-surface font-bold text-foreground transition hover:border-primary/50 hover:text-primary active:scale-[0.98]",
          compact ? "px-3 py-2 text-xs" : "w-full px-3 py-2.5 text-sm",
          className,
        )}
      >
        <MessageCircle className="h-4 w-4" />
        {fr ? "Votre avis" : "Обратная связь"}
      </button>
      <FeedbackDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function CardFeedbackButton({ context }: { context: FeedbackContext }) {
  const { language } = useLanguage();
  const fr = language === "fr";
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto flex items-center gap-1.5 text-xs font-bold text-muted underline decoration-line underline-offset-4 transition hover:text-danger"
      >
        <span aria-hidden>⚠️</span>
        {fr ? "Une erreur dans cette carte ?" : "Ошибка в карточке?"}
      </button>
      <FeedbackDialog open={open} onClose={() => setOpen(false)} initialType="bug" context={context} cardReport />
    </>
  );
}

function FeedbackDialog({
  open,
  onClose,
  initialType,
  context,
  cardReport = false,
}: {
  open: boolean;
  onClose: () => void;
  initialType?: FeedbackType;
  context?: FeedbackContext;
  cardReport?: boolean;
}) {
  const { language } = useLanguage();
  const fr = language === "fr";
  const [type, setType] = useState<FeedbackType | null>(initialType ?? null);
  const [issueReason, setIssueReason] = useState<string>("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType(initialType ?? null);
    setIssueReason("");
    setMessage("");
    setSending(false);
    setSent(false);
    setError(null);
  }, [initialType, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, open]);

  const startPayload = useMemo(() => {
    const bits: string[] = [type ?? "feedback"];
    if (context?.lesson) bits.push(`l${context.lesson}`);
    if (context?.card) bits.push(`c${context.card}`);
    return bits.join("_").slice(0, 64);
  }, [context?.card, context?.lesson, type]);

  const botUrl = `https://t.me/${SUPPORT_BOT_USERNAME}?start=${encodeURIComponent(startPayload)}`;
  const canSubmit = Boolean(type && (message.trim() || (cardReport && issueReason)));

  if (!open) return null;

  const submit = async () => {
    if (!type || !canSubmit || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/support/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          message,
          issueReason: issueReason || undefined,
          context: {
            ...context,
            url: typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : undefined,
          },
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? (fr ? "Impossible d’envoyer le message." : "Не удалось отправить сообщение."));
      setSent(true);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={fr ? "Votre avis" : "Обратная связь"}>
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-label={fr ? "Fermer" : "Закрыть"} />
      <div className="animate-fade-up relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-line bg-surface p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:max-w-lg sm:rounded-[28px] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xl font-black">
              <span aria-hidden>💬</span>
              <h2>{cardReport ? (fr ? "Signaler la carte" : "Сообщить об ошибке") : (fr ? "Votre avis" : "Обратная связь")}</h2>
            </div>
            <p className="mt-1.5 text-sm leading-5 text-muted">
              {fr ? "Décrivez ce qui s’est passé. Vous pouvez écrire en russe." : "Расскажите, что произошло. Можно написать по-русски."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line" aria-label={fr ? "Fermer" : "Закрыть"}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <div className="mt-6 rounded-2xl border border-success/30 bg-success-soft p-5 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
            <p className="mt-2 font-extrabold">{fr ? "Merci ! Message envoyé." : "Спасибо! Сообщение отправлено разработчику."}</p>
            <button type="button" onClick={onClose} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-white">
              {fr ? "Fermer" : "Закрыть"}
            </button>
          </div>
        ) : (
          <>
            {!cardReport ? (
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {(Object.keys(TYPE_META) as FeedbackType[]).map((value) => {
                  const item = TYPE_META[value];
                  const Icon = item.icon;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setType(value)}
                      className={cn(
                        "flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-3 text-center text-xs font-extrabold transition",
                        type === value ? "border-primary bg-primary/10 text-primary" : "border-line bg-background-soft hover:border-primary/40",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.emoji} {fr ? item.fr : item.ru}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {context?.phrase ? (
              <div className="mt-5 rounded-2xl bg-background-soft p-4 text-sm">
                <p className="font-extrabold">{context.phrase}</p>
                {context.translation ? <p className="mt-1 text-muted">{context.translation}</p> : null}
                <p className="mt-2 text-xs font-bold text-muted">
                  {fr ? "Leçon" : "Урок"}: {context.lesson ?? "—"} · {fr ? "Carte" : "Карточка"}: {context.card ?? "—"}
                </p>
              </div>
            ) : null}

            {cardReport ? (
              <fieldset className="mt-5">
                <legend className="text-sm font-extrabold">{fr ? "Qu’est-ce qui ne va pas ?" : "Что не так?"}</legend>
                <div className="mt-2 grid gap-2">
                  {ISSUE_REASONS.map((reason) => (
                    <label key={reason.value} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold", issueReason === reason.value ? "border-primary bg-primary/10" : "border-line")}>
                      <input type="radio" name="feedback-reason" value={reason.value} checked={issueReason === reason.value} onChange={() => setIssueReason(reason.value)} className="accent-[var(--primary)]" />
                      {fr ? reason.fr : reason.ru}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <label className="mt-5 block text-sm font-extrabold" htmlFor="support-message">
              {cardReport ? (fr ? "Détails (facultatif)" : "Комментарий (необязательно)") : (fr ? "Message" : "Сообщение")}
            </label>
            <textarea
              id="support-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={1800}
              rows={4}
              placeholder={fr ? "Écrivez ici…" : "Напишите здесь…"}
              className="mt-2 w-full resize-none rounded-2xl border-2 border-line bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />

            {error ? <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm font-bold text-danger">{error}</p> : null}

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || sending}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-extrabold text-white shadow-[0_3px_0_0_var(--primary-strong)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Send className="h-4 w-4" />
              {sending ? (fr ? "Envoi…" : "Отправляем…") : (fr ? "Envoyer" : "Отправить")}
            </button>

            <div className="my-4 flex items-center gap-3 text-xs font-bold text-muted">
              <span className="h-px flex-1 bg-line" />
              {fr ? "ou" : "или"}
              <span className="h-px flex-1 bg-line" />
            </div>

            <a
              href={botUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-line bg-surface px-4 text-sm font-extrabold transition hover:border-primary/50 hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" />
              {fr ? "Écrire au développeur" : "Написать разработчику"}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <p className="mt-2 text-center text-[11px] text-muted">@{SUPPORT_BOT_USERNAME}</p>
          </>
        )}
      </div>
    </div>
  );
}
