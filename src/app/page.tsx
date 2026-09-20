import type { Metadata } from "next";
import Link from "next/link";
import { Check, LockKeyhole, MessageCircle, Sparkles, Star } from "lucide-react";
import { Badge, Card } from "@/components/ui/card";
import { categories, course, milestones, payments, pricing } from "@/lib/content/config";
import { getCourseStats, getLessonMetas } from "@/lib/content/loader";

export const metadata: Metadata = {
  title: "Español Real — живой испанский для жизни в Испании",
  description:
    "Учите реальные фразы вместо грамматики. 45 уроков по авторскому учебнику: квартира, банк, врач, документы, работа и друзья в Испании.",
  alternates: { canonical: "/" },
};

const BENEFITS = [
  { emoji: "🗣️", title: "Реальные разговоры", text: "Только фразы, которые слышно в Испании — без лишней академической теории." },
  { emoji: "📅", title: "Ежедневные ситуации", text: "Квартира, кофе, продукты, автобус, врач, банк, документы и работа." },
  { emoji: "✏️", title: "Авторский метод", text: "Уроки построены вокруг живых фраз, примеров и комментариев автора." },
  { emoji: "🔄", title: "Обучение через повторение", text: "Ошибки возвращаются в повторении, чтобы фразы закреплялись надолго." },
  { emoji: "⚡", title: "Легко и быстро", text: "Короткие занятия, которые удобно проходить каждый день." },
  { emoji: "🧳", title: "Для эмигрантов и путешественников", text: "Испанский для реальной жизни в Испании, а не только для учебника." },
];

const TELEGRAM_CHAT_URL = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_URL ||
  (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
    ? `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}`
    : "#community");

export default function LandingPage() {
  const stats = getCourseStats();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-sm font-black text-primary-contrast shadow-sm">ES</span>
            <span className="leading-tight">
              <span className="block text-base font-extrabold tracking-tight">Español Real</span>
              <span className="block text-[11px] font-semibold text-muted">Живой испанский</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-bold text-muted md:flex">
            <a href="#structure" className="transition hover:text-foreground">Программа</a>
            <a href="#method" className="transition hover:text-foreground">Метод</a>
            <a href="#pricing" className="transition hover:text-foreground">Цена</a>
            <a href="#community" className="transition hover:text-foreground">Сообщество</a>
          </nav>

          <Link href="/learn" className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-extrabold text-primary-contrast shadow-sm transition hover:bg-primary-strong active:scale-95">
            Начать бесплатно
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-surface">
          <div aria-hidden className="hero-skew absolute right-[-8%] top-0 h-full w-[49%] opacity-90" />
          <div aria-hidden className="absolute right-[9%] top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:py-24">
            <div className="flex flex-col items-start justify-center">
              <Badge tone="primary"><Sparkles className="h-3.5 w-3.5" /> Курс по авторскому учебнику</Badge>
              <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-[4.65rem]">
                Learn Real Spanish
                <span className="block text-primary">Spoken in Spain</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
                Учите реальные фразы вместо грамматики. От «Me cuentas» до собеседования — только то, что нужно в Испании.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/learn" className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-7 text-base font-extrabold text-primary-contrast shadow-[0_5px_0_0_var(--primary-strong)] transition hover:bg-primary-strong active:translate-y-0.5 active:scale-95">
                  Начать бесплатно
                </Link>
                <Link href="/learn/settings#premium" className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-primary bg-transparent px-7 text-base font-extrabold text-primary transition hover:bg-primary/5 active:scale-95">
                  Разблокировать за {payments.starsPrice} <Star className="h-4 w-4 fill-current" />
                </Link>
              </div>
              <p className="mt-4 text-sm font-medium text-muted">{course.freeLessonCount} уроков бесплатно · без карты · без регистрации</p>

              <div className="mt-10 grid w-full max-w-xl grid-cols-3 border-t border-line pt-6">
                <HeroStat value={`${stats.lessons}`} label="уроков" />
                <HeroStat value={`${stats.phrases}`} label="фраз" />
                <HeroStat value={`${stats.exams}`} label="экзаменов" />
              </div>
            </div>

            <div className="relative flex flex-col justify-center gap-5 lg:pl-10">
              <Card className="relative z-10 border-primary/10 p-7 shadow-[0_22px_60px_rgba(28,21,18,0.10)]">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted">Пример фразы</p>
                <p className="mt-3 text-2xl font-black leading-tight tracking-tight text-primary sm:text-3xl">Me pones un café con leche, por favor</p>
                <p className="mt-3 text-sm leading-6 text-muted">Мне кофе с молоком, пожалуйста — так заказывают в Испании, а не «I would like…».</p>
              </Card>

              <Card className="relative z-10 p-7 shadow-[0_22px_60px_rgba(28,21,18,0.08)]">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted">Карта адаптации</p>
                <ul className="mt-4 grid grid-cols-2 gap-2.5 text-sm font-bold">
                  {milestones.slice(0, 6).map((milestone) => (
                    <li key={milestone.id} className="flex min-w-0 items-center gap-2 rounded-xl bg-background px-3 py-3">
                      <span>{milestone.emoji}</span><span className="truncate">{milestone.title}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>

        <section id="method" className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Почему это работает</h2>
              <p className="mt-3 text-muted">Фокус на том испанском, который нужен в реальной жизни в Испании.</p>
            </div>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((benefit) => (
                <Card key={benefit.title} className="p-6 transition hover:-translate-y-1 hover:shadow-lg">
                  <span className="text-3xl">{benefit.emoji}</span>
                  <h3 className="mt-4 text-lg font-black tracking-tight">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{benefit.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="structure" className="bg-surface py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Структура курса</h2>
                <p className="mt-3 text-muted">{stats.lessons} уроков, {stats.phrases} фраз, {stats.exams} экзаменов</p>
              </div>
              <Link href="/learn/lessons" className="font-extrabold text-primary hover:underline">Все уроки →</Link>
            </div>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {milestones.map((milestone, index) => {
                const lessons = getMilestoneLessonCount(milestone.id);
                const free = index === 0;
                return (
                  <Card key={milestone.id} className="flex min-h-52 flex-col p-6 transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-3xl">{milestone.emoji}</span>
                      <Badge tone={free ? "primary" : undefined}>{free ? `Этап ${index + 1}` : <><LockKeyhole className="h-3.5 w-3.5" /> Premium</>}</Badge>
                    </div>
                    <h3 className="mt-5 text-lg font-black tracking-tight">{milestone.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{milestone.description}</p>
                    <p className="mt-auto pt-4 text-xs font-bold text-muted">{lessons} уроков</p>
                  </Card>
                );
              })}
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {categories.map((category) => <Badge key={category.id}>{category.emoji} {category.labelRu}</Badge>)}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Стоимость</h2>
            <p className="mt-3 text-muted">Premium — единоразовая покупка за {payments.starsPrice} ⭐ в Telegram.</p>
            <div className="mt-9 grid gap-5 lg:grid-cols-2">
              <Card className="flex flex-col p-7">
                <h3 className="text-xl font-black">{pricing.free.title}</h3>
                <p className="mt-1 text-sm text-muted">{pricing.free.period}</p>
                <p className="mt-4 text-4xl font-black">{pricing.free.price}</p>
                <ul className="mt-6 flex flex-col gap-3 text-sm">
                  {pricing.free.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{feature}</li>)}
                </ul>
                <Link href="/learn" className="mt-8 inline-flex h-14 items-center justify-center rounded-full border-2 border-primary px-6 font-extrabold text-primary transition hover:bg-primary/5 active:scale-95">Начать бесплатно</Link>
              </Card>

              <Card className="relative flex flex-col border-2 border-primary bg-primary p-7 text-primary-contrast shadow-[0_20px_55px_rgba(211,47,47,0.20)]">
                <div className="flex items-center gap-2"><h3 className="text-xl font-black">{pricing.premium.title}</h3><span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-extrabold">Telegram Stars</span></div>
                <p className="mt-1 text-sm text-white/75">{pricing.premium.period}</p>
                <p className="mt-4 text-4xl font-black">{payments.starsPrice} ⭐</p>
                <p className="mt-1 text-sm text-white/75">единоразово</p>
                <ul className="mt-6 flex flex-col gap-3 text-sm">
                  {pricing.premium.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" />{feature}</li>)}
                </ul>
                <Link href="/learn/settings#premium" className="mt-8 inline-flex h-14 items-center justify-center rounded-full bg-white px-6 font-extrabold text-primary transition hover:bg-white/90 active:scale-95">Разблокировать за {payments.starsPrice} ⭐</Link>
                <p className="mt-3 text-xs text-white/70">{pricing.premium.note}</p>
              </Card>
            </div>
          </div>
        </section>

        <section id="community" className="bg-surface py-16 sm:py-20">
          <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#229ED9]/12 text-[#229ED9]"><MessageCircle className="h-7 w-7" /></div>
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Сообщество в Telegram</h2>
            <p className="mt-3 max-w-2xl leading-7 text-muted">Общайтесь, задавайте вопросы по испанскому и практикуйте живые фразы вместе с другими учениками.</p>
            <a href={TELEGRAM_CHAT_URL} target="_blank" rel="noreferrer" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#229ED9] px-6 font-extrabold text-white transition hover:brightness-95 active:scale-95">
              <MessageCircle className="h-5 w-5" /> Присоединиться к чату
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <div><p className="text-base font-black">Español Real</p><p className="mt-2 text-sm text-muted">{course.subtitle}</p></div>
            <div><p className="font-black">Разделы</p><ul className="mt-3 flex flex-col gap-2 text-sm text-muted"><li><Link href="/learn">Дашборд</Link></li><li><Link href="/learn/lessons">Уроки</Link></li><li><Link href="/learn/map">Карта адаптации</Link></li></ul></div>
            <div><p className="font-black">Продукт</p><ul className="mt-3 flex flex-col gap-2 text-sm text-muted"><li><a href="#pricing">Цена</a></li><li><Link href="/learn/settings#premium">Оплата Stars</Link></li><li><a href="#community">Сообщество</a></li></ul></div>
          </div>
          <p className="mt-8 border-t border-line pt-5 text-xs text-muted">© {new Date().getFullYear()} Español Real. Учебные материалы принадлежат автору и защищены авторским правом.</p>
        </div>
      </footer>

      <a href={TELEGRAM_CHAT_URL} target="_blank" rel="noreferrer" aria-label="Telegram" className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#229ED9] text-white shadow-lg transition hover:scale-105 active:scale-95">
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return <div className="text-center"><dt className="text-2xl font-black">{value}</dt><dd className="mt-1 text-xs font-bold text-muted">{label}</dd></div>;
}

const MILESTONE_COUNTS = getLessonMetas().reduce<Record<string, number>>((acc, meta) => {
  acc[meta.milestone] = (acc[meta.milestone] ?? 0) + 1;
  return acc;
}, {});

function getMilestoneLessonCount(id: string) {
  return MILESTONE_COUNTS[id] ?? 0;
}
