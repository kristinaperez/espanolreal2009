import type { Metadata } from "next";
import Link from "next/link";
import { payments } from "@/lib/content/config";

export const metadata: Metadata = {
  title: "Условия использования",
  description: "Условия бесплатного доступа и Premium в Español Real, включая оплату Telegram Stars и ограничения учебного сервиса.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Условия использования · Español Real", description: "Бесплатный доступ, Premium и правила использования Español Real.", url: "/terms", type: "website" },
};

export default function TermsPage() {
  return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><h1 className="text-4xl font-black">Условия использования</h1><p className="mt-5 text-sm text-muted">Обновлено: 20 октября 2026</p>
    <section className="mt-8 space-y-3"><h2 className="text-2xl font-black">Бесплатный доступ</h2><p>Бесплатный доступ заканчивается после первого завершённого урока или через 7 дней с начала обучения — что наступит раньше. Публичные описания уроков доступны для знакомства с программой.</p></section>
    <section className="mt-8 space-y-3"><h2 className="text-2xl font-black">Premium</h2><p>Premium стоит {payments.starsPrice} Telegram Stars за 30 дней. Продление вручную, без автоматических списаний. Ранее купленный бессрочный доступ сохраняется. Для покупки и восстановления доступа используется Telegram-вход.</p></section>
    <section className="mt-8 space-y-3"><h2 className="text-2xl font-black">Учебный характер</h2><p>Español Real — языковой тренажёр. Материалы о враче, документах, банке и других жизненных ситуациях помогают практиковать язык и не являются медицинской, юридической или финансовой консультацией.</p></section>
    <section className="mt-8 space-y-3"><h2 className="text-2xl font-black">Техническая доступность</h2><p>Приложение можно установить как PWA, но постоянная офлайн-доступность всех функций не гарантируется. Закрытые уроки могут требовать серверной проверки или загрузки.</p></section>
    <p className="mt-10 text-sm text-muted">Если возник вопрос по доступу или оплате, используйте <Link href="/contacts" className="font-bold text-primary underline">поддержку</Link>. Этот текст не подменяет реквизиты или юридические сведения, которые должны быть подтверждены владельцем сервиса.</p>
  </main>;
}
