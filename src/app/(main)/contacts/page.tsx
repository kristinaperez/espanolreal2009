import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Контакты и поддержка",
  description: "Как связаться с поддержкой Español Real по вопросам доступа, оплаты Telegram Stars, ошибок и предложений.",
  alternates: { canonical: "/contacts" },
  openGraph: { title: "Контакты и поддержка Español Real", description: "Поддержка по вопросам доступа, оплаты, ошибок и предложений.", url: "/contacts", type: "website" },
};

export default function ContactsPage() {
  return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <p className="text-sm font-bold uppercase tracking-widest text-primary">Español Real</p><h1 className="mt-2 text-4xl font-black">Контакты и поддержка</h1>
    <p className="mt-6 text-lg leading-8 text-muted">По вопросам работы тренажёра, доступа Premium, оплаты Telegram Stars, ошибок и предложений используйте официальный бот поддержки.</p>
    <a href={site.support.telegramBot} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-extrabold text-primary-contrast">Написать в Telegram Support</a>
    <section className="mt-10"><h2 className="text-2xl font-black">Перед обращением</h2><p className="mt-3 leading-7">Не отправляйте пароли, токены ботов, платёжные ключи и другие секреты. Для проблемы с доступом опишите, на какой странице возникла ошибка и что происходило перед ней.</p></section>
    <p className="mt-10 text-sm text-muted">Информация об обработке данных — в <Link href="/privacy" className="font-bold text-primary underline">политике конфиденциальности</Link>. Условия Premium — в <Link href="/terms" className="font-bold text-primary underline">условиях использования</Link>.</p>
  </main>;
}
