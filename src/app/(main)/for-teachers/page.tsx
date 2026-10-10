import type { Metadata } from "next";
import Link from "next/link";
import { HeaderNavUpdate } from "@/components/layout/header-nav-update";

export const metadata: Metadata = {
  title: "Инструмент для преподавателей испанского",
  description: "Español Real помогает преподавателям создавать интерактивные учебные посты с примерами, объяснениями и заданиями для учеников испанского.",
  alternates: { canonical: "/for-teachers" },
};

const faq = [
  ["Что можно создавать?", "Структурированные учебные посты: заголовок, объяснение, примеры, полезные фразы и интерактивные задания."],
  ["Публикация автоматическая?", "Нет. Доступные способы публикации зависят от текущих возможностей кабинета и подключённых сервисов."],
  ["AI-генерация всегда доступна?", "Режим генерации зависит от серверной конфигурации. Если AI-провайдер не настроен, кабинет не должен обещать реальную AI-генерацию."],
  ["Нужен ли отдельный кабинет?", "Текущий кабинет преподавателя находится в Español Real и открывается по ссылке ниже."],
];

export default function ForTeachersPage() {
  return <div className="min-h-dvh bg-background">
    <HeaderNavUpdate />
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Español Real для преподавателей</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Создавайте интерактивные посты для учеников испанского</h1>
        <p className="mt-5 text-lg leading-8 text-muted">Инструмент для репетиторов и преподавателей, которым нужны готовые учебные материалы вокруг живого испанского: объяснение, примеры и практика в одном формате.</p>
        <Link href="/teacher" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-extrabold text-white">Открыть кабинет преподавателя</Link>
      </header>
      <section className="mt-14"><h2 className="text-2xl font-black">Кому подходит</h2><p className="mt-3 leading-7 text-muted">Репетиторам испанского, небольшим языковым школам и преподавателям, которые регулярно готовят материалы для учеников и социальных сетей.</p></section>
      <section className="mt-12"><h2 className="text-2xl font-black">Какие материалы создаются</h2><div className="mt-5 grid gap-4 sm:grid-cols-3">{["Объяснение живой фразы в контексте","Примеры и ключевые выражения","Интерактивная проверка понимания"].map(x=><div key={x} className="rounded-2xl border border-line bg-surface p-5 font-bold">{x}</div>)}</div></section>
      <section className="mt-12"><h2 className="text-2xl font-black">Как это работает</h2><ol className="mt-4 grid gap-3 text-muted"><li><b className="text-foreground">1.</b> Откройте кабинет и создайте материал.</li><li><b className="text-foreground">2.</b> Проверьте и отредактируйте текст, примеры и задания.</li><li><b className="text-foreground">3.</b> Используйте доступные в кабинете способы публикации и распространения.</li></ol></section>
      <section className="mt-12 rounded-3xl border border-line bg-surface p-6"><h2 className="text-2xl font-black">Что доступно сейчас</h2><p className="mt-3 leading-7 text-muted">В проекте есть кабинет преподавателя, редактор/генератор структурированных постов, публичное представление поста и интерактивные задания. Конкретные AI-возможности зависят от серверных настроек. Español Real не обещает автоматическую публикацию во всех социальных сетях, отдельный биллинг преподавателей или полноценный каталог преподавателей.</p></section>
      <section className="mt-12"><h2 className="text-2xl font-black">Частые вопросы</h2><div className="mt-5 grid gap-4">{faq.map(([q,a])=><div key={q} className="rounded-2xl border border-line bg-surface p-5"><h3 className="font-extrabold">{q}</h3><p className="mt-2 text-sm leading-6 text-muted">{a}</p></div>)}</div></section>
      <div className="mt-12"><Link href="/teacher" className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-extrabold text-white">Перейти в кабинет</Link></div>
    </main>
  </div>;
}
