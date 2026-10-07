import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Конфиденциальность",
  description: "Какие данные использует Español Real для прогресса, Telegram-входа, Premium-доступа и поддержки.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Конфиденциальность · Español Real", description: "Информация о данных, необходимых для работы Español Real.", url: "/privacy", type: "website" },
};

export default function PrivacyPage() {
  return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><h1 className="text-4xl font-black">Конфиденциальность</h1><p className="mt-5 text-sm text-muted">Обновлено: 7 октября 2026</p>
    <section className="mt-8 space-y-3"><h2 className="text-2xl font-black">Какие данные используются</h2><p>Учебный прогресс хранится локально в браузере. Для покупки и восстановления Premium используется Telegram-вход и серверная проверка права доступа. Платёжный поток Telegram Stars обрабатывает данные, необходимые для создания заказа и подтверждения оплаты.</p></section>
    <section className="mt-8 space-y-3"><h2 className="text-2xl font-black">Поддержка</h2><p>Если вы сами отправляете сообщение в поддержку, его содержимое используется для ответа на ваш вопрос. Не отправляйте пароли, токены или другие секреты.</p></section>
    <section className="mt-8 space-y-3"><h2 className="text-2xl font-black">Локальное хранение и PWA</h2><p>Браузер может хранить настройки, прогресс и технические данные, необходимые для работы интерфейса и PWA. Удаление данных сайта в браузере может удалить локально сохранённый прогресс.</p></section>
    <section className="mt-8 space-y-3"><h2 className="text-2xl font-black">Внешние сервисы</h2><p>Telegram используется для входа, поддержки и оплаты Stars. Эти сервисы применяют собственные правила обработки данных.</p></section>
    <p className="mt-10 text-sm text-muted">По вопросам сервиса используйте страницу <Link href="/contacts" className="font-bold text-primary underline">контактов</Link>. Этот текст описывает фактическую работу продукта и не добавляет неподтверждённые юридические реквизиты.</p>
  </main>;
}
