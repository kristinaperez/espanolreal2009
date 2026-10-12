import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedStory,publishedStories } from "@/lib/stories";
type Props={params:Promise<{slug:string}>};
export function generateStaticParams(){return publishedStories.map(s=>({slug:s.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const s=getPublishedStory(slug);if(!s)return {robots:{index:false}};const url=`https://espanolreal.es/ru/zachem-uchit-ispanskiy/${slug}/`;return {title:`${s.title} | EspañolReal`,description:s.description,alternates:{canonical:url},openGraph:{type:"article",title:s.title,description:s.description,url}};}
export default async function StoryPage({params}:Props){const {slug}=await params;const s=getPublishedStory(slug);if(!s)notFound();return <main className="mx-auto max-w-3xl px-5 py-12"><Link href="/ru/100-prichin-uchit-ispanskiy/">← Все истории</Link><article className="mt-8"><h1 className="text-3xl font-bold">{s.title}</h1><p className="mt-5 text-lg">{s.intro}</p>{s.paragraphs.map((p,i)=><p key={i} className="mt-5 leading-7">{p}</p>)}<h2 className="mt-8 text-2xl font-semibold">Полезные фразы</h2><ul className="mt-4 space-y-3">{s.phrases.map(p=><li key={p.es}><strong lang="es">{p.es}</strong> — {p.ru}</li>)}</ul><p className="mt-8"><Link className="underline" href={s.lessonHref}>Попробовать уроки EspañolReal →</Link></p></article></main>}
