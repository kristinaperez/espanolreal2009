import { notFound } from "next/navigation";
import { ArabicShell } from "@/components/arabic/shell";
import { SituationTrainer } from "@/components/arabic/situation-trainer";
import { findSituation, situationLessons } from "@/lib/arabic/lessons";
import { AudioButton } from "@/components/arabic/audio-button";
export const dynamicParams = false;
export function generateStaticParams() { return situationLessons.map(l => ({ slug: l.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const source = findSituation(slug); if (!source) notFound(); return { title: source.title.ar, description: source.outcome.ar, alternates: { canonical: `/ar/lesson/${slug}`, languages: { ar: `/ar/lesson/${slug}` } }, robots: { index: false, follow: true } }; }
export default async function ArabicLesson({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const source = findSituation(slug); if (!source) notFound();
  const next = situationLessons[situationLessons.indexOf(source) + 1];
  return <ArabicShell><h1 className="text-3xl font-black leading-relaxed">{source.title.ar}</h1><p className="leading-8">{source.outcome.ar}</p><SituationTrainer source={source} nextSlug={next?.slug} /><details className="rounded-2xl border border-line p-5"><summary className="cursor-pointer font-bold">عبارات الدرس للقراءة والاستماع</summary><ul className="mt-5 space-y-4">{source.phrases.map(p => <li key={p.spanish} className="space-y-2"><p lang="es" dir="ltr" className="font-bold">{p.spanish}</p><p>{p.translations.ar}</p><AudioButton spanish={p.spanish} lessonId={source.slug} /></li>)}</ul></details></ArabicShell>;
}
