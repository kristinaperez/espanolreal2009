import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonMetas } from "@/lib/content/loader";
import { topicBySlug, topics } from "@/lib/seo/topics";

const siteUrl = "https://espanolreal.es";

export const dynamicParams = false;

export function generateStaticParams() {
  return topics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = topicBySlug.get(slug as (typeof topics)[number]["slug"]);
  if (!topic) return { title: "Тема не найдена", robots: { index: false, follow: true } };
  return {
    title: topic.title,
    description: topic.description,
    alternates: { canonical: `/topics/${topic.slug}` },
    openGraph: { title: topic.title, description: topic.description, url: `/topics/${topic.slug}`, type: "website" },
  };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = topicBySlug.get(slug as (typeof topics)[number]["slug"]);
  if (!topic) notFound();

  const metas = getLessonMetas();
  const lessons = topic.lessonNumbers.map((number) => metas.find((lesson) => lesson.lesson === number)).filter(Boolean);
  const related = (topic.relatedLessonNumbers ?? []).map((number) => metas.find((lesson) => lesson.lesson === number)).filter(Boolean);
  const url = `${siteUrl}/topics/${topic.slug}`;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Español Real", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Темы", item: `${siteUrl}/learn/lessons` },
      { "@type": "ListItem", position: 3, name: topic.title, item: url },
    ],
  };

  return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }} />
    <nav aria-label="Хлебные крошки" className="text-sm text-muted"><Link href="/">Español Real</Link> / <Link href="/learn/lessons">Уроки</Link> / <span>{topic.slug}</span></nav>
    <header className="mt-5 max-w-3xl"><p className="text-sm font-bold uppercase tracking-widest text-primary">Тематическая подборка</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{topic.title}</h1><p className="mt-5 text-lg leading-8 text-muted">{topic.intro}</p></header>
    <section className="mt-12"><h2 className="text-2xl font-black">Уроки по теме</h2><div className="mt-5 grid gap-4">{lessons.map((lesson) => lesson ? <article key={lesson.lesson} className="rounded-2xl border border-line bg-surface p-5"><p className="text-xs font-bold uppercase tracking-widest text-muted">Урок {lesson.lesson} · {lesson.difficulty}</p><h3 className="mt-2 text-xl font-extrabold"><Link href={`/lesson/${lesson.lesson}`} className="text-primary underline decoration-primary/30">{lesson.summary ?? lesson.title}</Link></h3>{lesson.situation ? <p className="mt-2 text-sm leading-6 text-muted">{lesson.situation}</p> : null}<p className="mt-3 text-sm">{lesson.phraseCount} фраз · <Link href={`/lesson/${lesson.lesson}`} className="font-bold text-primary">Открыть описание урока →</Link></p></article> : null)}</div></section>
    {related.length ? <section className="mt-10"><h2 className="text-xl font-black">Связанные ситуации</h2><ul className="mt-3 grid gap-2">{related.map((lesson) => lesson ? <li key={lesson.lesson}><Link href={`/lesson/${lesson.lesson}`} className="font-bold text-primary underline">Урок {lesson.lesson}: {lesson.summary ?? lesson.title}</Link></li> : null)}</ul></section> : null}
    <section className="mt-12"><h2 className="text-xl font-black">Другие темы</h2><nav className="mt-4 flex flex-wrap gap-3" aria-label="Другие тематические подборки">{topics.filter((item) => item.slug !== topic.slug).map((item) => <Link key={item.slug} href={`/topics/${item.slug}`} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold">{item.title}</Link>)}</nav></section>
  </main>;
}
