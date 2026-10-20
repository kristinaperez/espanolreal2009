"use client";
import { useAuth } from "@/components/providers/auth-provider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

import Link from "next/link";
import { Menu, Settings, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";

export function HeaderNavUpdate() {
  const { account } = useAuth();
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const fr = language === "fr";
  const links = [
    ["/#structure", fr ? "Programme" : "Программа"],
    ["/#method", fr ? "Méthode" : "Метод"],
    ["/#pricing", fr ? "Tarifs" : "Цена"],
    ["/#community", fr ? "Communauté" : "Сообщество"],
    ["/blog", "Блог"],
  ];
  return <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 text-stone-900 backdrop-blur-xl">
    <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#9E2A2B] text-sm font-black text-white">ES</span>
          <span className="min-w-0"><b className="hidden text-sm sm:block sm:text-base">Español Real</b><small className="hidden text-xs text-stone-500 sm:block">{fr ? "L’espagnol vivant" : "Живой испанский"}</small></span>
        </Link>
        <nav aria-label={fr ? "Navigation principale" : "Основная навигация"} className="hidden items-center gap-4 text-xs font-bold xl:flex">
          {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {account?.blogAdmin && <Link href="/admin/blog" className="inline-flex min-h-11 items-center text-sm font-bold">Статьи</Link>}
          <LanguageSwitcher />
          <Link href="/learn/settings" aria-label={fr ? "Réglages" : "Настройки"} className="grid h-11 w-11 place-items-center rounded-xl border border-stone-200"><Settings size={18} /></Link>
          <button type="button" aria-expanded={open} aria-controls="mobile-site-nav" aria-label={open ? "Закрыть меню" : "Открыть меню"} onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-xl border border-stone-200 xl:hidden">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && <nav id="mobile-site-nav" aria-label="Мобильная навигация" className="mt-3 grid gap-1 border-t border-stone-200 pt-3 xl:hidden">
        {links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-stone-50">{label}</Link>)}
        <Link href={fr ? "/lesson/1" : "/learn"} className="rounded-xl px-3 py-3 text-sm font-bold text-[#9E2A2B]">{fr ? "Commencer gratuitement" : "Начать бесплатно"}</Link>
      </nav>}
    </div>
  </header>;
}
