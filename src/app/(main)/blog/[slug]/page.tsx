import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeaderNavUpdate } from "@/components/layout/header-nav-update";
import { ArticleBody } from "@/components/blog/article-body";
import { getArticle } from "@/server/blog";
import { validSlug } from "@/lib/blog";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
async function articleFor(params: Props["params"]) {
  const { slug } = await params; return validSlug(slug) ? getArticle(slug) : null;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await articleFor(params); if (!article) return {};
  return { title: article.title, description: article.description, alternates: { canonical: `/blog/${article.slug}` }, openGraph: { type: "article", title: article.title, description: article.description, url: `/blog/${article.slug}`, publishedTime: article.createdAt.toISOString(), modifiedTime: article.updatedAt.toISOString() } };
}
export default async function ArticlePage({ params }: Props) {
  const article = await articleFor(params); if (!article) notFound();
  const jsonLd = { "@context": "https://schema.org", "@type": "BlogPosting", headline: article.title, description: article.description, datePublished: article.createdAt.toISOString(), dateModified: article.updatedAt.toISOString(), author: { "@type": "Person", name: "Cristina Pérez", url: "https://espanolreal.es/about-author" }, mainEntityOfPage: `https://espanolreal.es/blog/${article.slug}` };
  return <><HeaderNavUpdate /><main className="mx-auto max-w-3xl px-4 py-10"><Link href="/blog" className="inline-flex min-h-11 items-center font-bold text-primary">← Все статьи</Link><article><h1 className="mt-5 text-3xl font-black sm:text-5xl">{article.title}</h1><p className="my-5 text-sm text-muted">Кристина Перез · {article.updatedAt.toLocaleDateString("ru-RU", { timeZone: "Europe/Madrid" })}</p><p className="mb-8 text-xl leading-8 text-muted">{article.description}</p><ArticleBody body={article.body} /></article><Link href="/lesson/1" className="mt-10 inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 font-bold text-primary-contrast">Попробовать испанский на практике →</Link><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /></main></>;
}
