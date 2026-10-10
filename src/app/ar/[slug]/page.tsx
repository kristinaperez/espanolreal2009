import { notFound } from "next/navigation";
import { ArabicSeoPage } from "@/components/arabic/seo-page";
import { arabicSeoPages, findArabicPage } from "@/lib/arabic/seo-content";
import { arabicMetadata } from "@/lib/arabic/metadata";
export const dynamicParams = false;
export function generateStaticParams() { return arabicSeoPages.filter(p => p.slug).map(p => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const page = findArabicPage(slug); if (!page) notFound(); return arabicMetadata(page); }
export default async function ArabicTopic({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const page = findArabicPage(slug); if (!page) notFound(); return <ArabicSeoPage page={page} />; }
