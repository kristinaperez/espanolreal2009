"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div className={cn("inline-flex items-center rounded-full border border-line bg-surface p-1 text-xs font-extrabold", compact ? "" : "shadow-sm")} aria-label="Language selector">
      <button type="button" onClick={() => setLanguage("ru")} className={cn("rounded-full px-2.5 py-1.5 transition", language === "ru" ? "bg-primary text-white" : "text-muted hover:text-foreground")}>
        🇷🇺 {!compact && "Русский"}
      </button>
      <button type="button" onClick={() => setLanguage("fr")} className={cn("rounded-full px-2.5 py-1.5 transition", language === "fr" ? "bg-primary text-white" : "text-muted hover:text-foreground")}>
        🇫🇷 {!compact && "Français"}
      </button>
    </div>
  );
}
