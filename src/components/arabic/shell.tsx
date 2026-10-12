import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
export function ArabicShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-line bg-surface"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
      <Link href="/ar" className="text-xl font-black"><bdi lang="es" dir="ltr">🇪🇸 EspañolReal</bdi></Link>
      <LanguageSwitcher />
      <nav aria-label="التنقل" className="flex w-full flex-wrap gap-x-5 gap-y-2 text-sm font-bold"><Link href="/ar/spanish-for-life-in-spain">الحياة في إسبانيا</Link><Link href="/ar/spanish-for-renting">السكن</Link><Link href="/ar/spanish-at-doctor">الطبيب</Link><Link href="/ar/spanish-for-work">العمل</Link><Link href="/ar/account">الحساب</Link></nav>
    </div></header>
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-10">{children}</main>
    <footer className="mx-auto flex max-w-5xl flex-wrap gap-4 border-t border-line px-4 py-6 text-sm text-muted"><span><bdi dir="ltr">EspañolReal · Cristina Pérez</bdi></span><Link href="/ar">الرئيسية</Link><Link href="/privacy">سياسة الخصوصية (بالروسية)</Link><a href="https://t.me/EspanolRealSupportBot" target="_blank" rel="noopener noreferrer">الدعم عبر Telegram</a></footer>
  </div>;
}
