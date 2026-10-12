import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Автор Español Real — Cristina Pérez",
  description: "Об авторе Español Real и методе разговорного испанского для реальных ситуаций жизни в Испании.",
  alternates: { canonical: "/about-author" },
  openGraph: { title: "Автор Español Real — Cristina Pérez", description: "Автор и метод Español Real: разговорный испанский для реальных ситуаций жизни в Испании.", url: "/about-author", type: "profile" },
};

export default function AuthorPage() {
  const personLd = { "@context": "https://schema.org", "@type": "Person", "@id": `${site.url}/about-author#person`, name: site.author, url: `${site.url}/about-author`, knowsAbout: ["испанский язык", "разговорный испанский", "обучение взрослых"] };
  return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd).replace(/</g, "\\u003c") }} />
    <p className="text-sm font-bold uppercase tracking-widest text-primary">Автор</p>
    <h1 className="mt-2 text-4xl font-black tracking-tight">Cristina Pérez — автор Español Real</h1>
    <p className="mt-6 text-lg leading-8 text-muted">Español Real — авторский тренажёр разговорного испанского для людей, которым язык нужен в реальных ситуациях жизни в Испании.</p>
    <section className="mt-10"><h2 className="text-2xl font-black">Метод</h2><p className="mt-3 leading-7">Уроки строятся вокруг готовых фраз, ситуаций, примеров и повторения: жильё, кафе, транспорт, врач, банк, документы, работа и повседневное общение. Цель — помочь быстрее начать понимать и использовать нужные выражения, а не заменить полноценное изучение грамматики.</p></section>
    <section className="mt-10"><h2 className="text-2xl font-black">Что посмотреть дальше</h2><p className="mt-3"><Link href="/learn/about" className="font-bold text-primary underline">Как устроен метод и курс</Link> · <Link href="/learn/lessons" className="font-bold text-primary underline">Все уроки</Link> · <Link href="/contacts" className="font-bold text-primary underline">Контакты и поддержка</Link></p></section>
  </main>;
}
