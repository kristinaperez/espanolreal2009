"use client";

import Link from "next/link";
import { Menu, Plus, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuth } from "@/components/providers/auth-provider";

export function HeaderNavUpdate() {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const { user } = useAuth();
  const fr = language === "fr";
  const links = [
    ["/#structure", fr ? "Programme" : "Программа"],
    ["/#method", fr ? "Méthode" : "Метод"],
    ["/#pricing", fr ? "Tarifs" : "Цена"],
    ["/#community", fr ? "Communauté" : "Сообщество"],
    ["/teacher", fr ? "Enseignants" : "Преподавателям"],
  ];
  return <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 text-stone-900 backdrop-blur-xl">
    <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#9E2A2B] text-sm font-black text-white">ES</span>
          <span className="min-w-0"><b className="block text-sm sm:text-base">Español Real</b><small className="block text-xs text-stone-500">{fr ? "L’espagnol vivant" : "Живой испанский"}</small></span>
        </Link>
        <nav aria-label={fr ? "Navigation principale" : "Основная навигация"} className="hidden items-center gap-4 text-xs font-bold xl:flex">
          {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/teacher/posts/new" className="hidden min-h-11 items-center gap-1 rounded-full bg-[#9E2A2B] px-4 text-sm font-bold text-white sm:inline-flex"><Plus size={16} />{fr ? "Créer un post" : "Создать пост"}</Link>
          <Link href="/teacher" className="hidden min-h-11 items-center rounded-full border border-stone-200 px-4 text-sm font-bold lg:inline-flex">{user ? (fr ? "Mon espace" : "Кабинет") : (fr ? "Connexion" : "Войти")}</Link>
          <button type="button" aria-expanded={open} aria-controls="mobile-site-nav" aria-label={open ? "Закрыть меню" : "Открыть меню"} onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-xl border border-stone-200 xl:hidden">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      <Link href="/teacher/posts/new" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#9E2A2B] px-4 text-sm font-bold text-white sm:hidden"><Plus size={16} />{fr ? "Créer un post" : "Создать пост"}</Link>
      {open && <nav id="mobile-site-nav" aria-label="Мобильная навигация" className="mt-3 grid gap-1 border-t border-stone-200 pt-3 xl:hidden">
        {links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-stone-50">{label}</Link>)}
        <Link href="/teacher" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-bold">{user ? "Кабинет" : "Войти через Telegram"}</Link>
        <Link href={fr ? "/lesson/1" : "/learn"} className="rounded-xl px-3 py-3 text-sm font-bold text-[#9E2A2B]">{fr ? "Commencer gratuitement" : "Начать бесплатно"}</Link>
      </nav>}
    </div>
  </header>;
}
