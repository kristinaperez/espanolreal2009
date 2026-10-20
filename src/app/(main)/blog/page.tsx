import type { Metadata } from "next";
import Link from "next/link";
import { HeaderNavUpdate } from "@/components/layout/header-nav-update";
import { Card } from "@/components/ui/card";
import { listArticles } from "@/server/blog";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Блог: испанский для жизни в Испании", description: "Статьи Español Real о разговорном испанском, живых фразах и жизни в Испании.", alternates: { canonical: "/blog" } };
export default async function BlogPage() {
  const articles = await listArticles();
  return <><HeaderNavUpdate /><main className="mx-auto max-w-5xl px-4 py-12"><h1 className="text-4xl font-black">Блог Español Real</h1><p className="mt-4 text-lg text-muted">Живой испанский и жизнь в Испании — в историях, фразах и примерах.</p><div className="mt-9 grid gap-5 md:grid-cols-2">{articles.map(article => <Card key={article.slug}><p className="text-sm text-muted">{article.updatedAt.toLocaleDateString("ru-RU", { timeZone: "Europe/Madrid" })}</p><h2 className="mt-3 text-2xl font-extrabold"><Link className="hover:text-primary" href={`/blog/${article.slug}`}>{article.title}</Link></h2><p className="mt-3 leading-7 text-muted">{article.description}</p><Link className="mt-4 inline-flex min-h-11 items-center font-bold text-primary" href={`/blog/${article.slug}`}>Читать статью →</Link></Card>)}</div>{!articles.length && <Card className="mt-8"><p>Здесь скоро появятся первые статьи.</p></Card>}<Link href="/lesson/1" className="mt-8 inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 font-bold text-primary-contrast">Попробовать первый урок</Link></main></>;
}
