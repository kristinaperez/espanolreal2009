"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  return (
    <div className={cn("inline-flex items-center rounded-full border border-line bg-surface p-1 text-xs font-extrabold", compact ? "" : "shadow-sm")} aria-label="Language selector">
      <button type="button" aria-label="Русский" aria-pressed={language === "ru"} onClick={() => { setLanguage("ru"); if (language === "ar") router.push("/"); }} className={cn("rounded-full px-2.5 py-1.5 transition", language === "ru" ? "bg-primary text-white" : "text-muted hover:text-foreground")}>
        🇷🇺 {!compact && "Русский"}
      </button>
      <button type="button" aria-label="Français" aria-pressed={language === "fr"} onClick={() => { setLanguage("fr"); if (language === "ar") router.push("/lesson/1"); }} className={cn("rounded-full px-2.5 py-1.5 transition", language === "fr" ? "bg-primary text-white" : "text-muted hover:text-foreground")}>
        🇫🇷 {!compact && "Français"}
      </button>
      <Link href="/ar" lang="ar" aria-label="العربية" aria-current={language === "ar" ? "page" : undefined} className={cn("rounded-full px-2.5 py-1.5", language === "ar" ? "bg-primary text-white" : "text-muted")}>العربية</Link>
    </div>
  );
}
