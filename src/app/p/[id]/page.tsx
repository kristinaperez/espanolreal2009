import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { readSnapshot } from "@/server/share/store";
import { PostPreview } from "@/components/teacher-posts/post-preview";
export const dynamic="force-dynamic";
const getPost=cache(readSnapshot);
const siteUrl="https://espanolreal.es";
type Props={params:Promise<{id:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {id}=await params;const p=await getPost(id);if(!p)return{title:"Пост не найден",robots:{index:false,follow:false}};const url=`${siteUrl}/p/${id}`;return{title:p.title,description:p.description,alternates:{canonical:url},robots:{index:true,follow:true},openGraph:{title:p.title,description:p.description,type:"article",url,images:[{url:p.imageUrl,width:1200,height:630,alt:p.title}]},twitter:{card:"summary_large_image",title:p.title,description:p.description,images:[p.imageUrl]}};}
export default async function Page({params}:Props){const {id}=await params;const p=await getPost(id);if(!p)notFound();return <main className="mx-auto max-w-3xl px-4 py-10"><p className="mb-4 text-sm text-stone-500">Español Real · {p.authorName}</p><PostPreview post={p.post} cta={p.cta} headingLevel="h1"/></main>;}
