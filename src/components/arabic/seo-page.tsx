import Link from "next/link";
import { ArabicShell } from "./shell";
import { AudioButton } from "./audio-button";
import { ArabicTrackedLink } from "./tracked-link";
import { adaptationMap, arabicPath, arabicSeoPages, type ArabicSeoContent } from "@/lib/arabic/seo-content";
import { site } from "@/lib/seo/site";
export function ArabicSeoPage({ page }: { page: ArabicSeoContent }) {
  const url = `${site.url}${arabicPath(page.slug)}`;
  const schema = {
    "@context": "https://schema.org", "@graph": [
      { "@type": "WebPage", "@id": `${url}#page`, url, name: page.h1, description: page.description, inLanguage: "ar", isPartOf: { "@id": `${site.url}/ar#website` } },
      { "@type": "LearningResource", "@id": `${url}#resource`, url, name: page.h1, inLanguage: ["ar", "es"], educationalLevel: "A0–A1", learningResourceType: "language practice", teaches: page.phrases.map(p => p.spanish), isAccessibleForFree: true },
      { "@type": "FAQPage", "@id": `${url}#faq`, inLanguage: "ar", mainEntity: page.faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ...(!page.slug ? [
        { "@type": "WebSite", "@id": `${site.url}/ar#website`, url: `${site.url}/ar`, name: site.name, inLanguage: "ar", creator: { "@id": `${site.url}/ar#author` } },
        { "@type": "Person", "@id": `${site.url}/ar#author`, name: site.author, url: `${site.url}/about-author` },
      ] : []),
    ],
  };
  return <ArabicShell>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <nav aria-label="مسار الصفحة" className="text-sm text-muted"><Link href="/ar">الرئيسية</Link>{page.slug && <> / <span>{page.h1}</span></>}</nav>
    <section className="rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-10">
      <p className="mb-3 text-sm font-bold text-primary">الإسبانية للحياة في إسبانيا</p>
      <h1 className="max-w-3xl text-3xl font-black leading-relaxed sm:text-4xl">{page.h1}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-9">{page.intro}</p>
      <div className="mt-6 flex flex-wrap gap-3"><ArabicTrackedLink href={`/ar/lesson/${page.lesson}`} lessonId={page.lesson}>{page.cta}</ArabicTrackedLink><ArabicTrackedLink secondary href={`/ar/lesson/${page.lesson}`} lessonId={page.lesson}>جرّب درسًا</ArabicTrackedLink></div>
    </section>
    {(!page.slug || page.slug === "spanish-for-life-in-spain") && <section aria-labelledby="adaptation-heading"><h2 id="adaptation-heading" className="mb-4 text-2xl font-bold">خريطة الحياة في إسبانيا</h2><ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{adaptationMap.map((item, index) => <li key={index}><Link href={arabicPath(item.slug)} className="block rounded-2xl border border-line bg-surface p-4 font-bold hover:border-primary">{item.label}</Link></li>)}</ul></section>}
    <div className="grid gap-5 sm:grid-cols-2">{page.sections.map(section => <section key={section.heading} className="rounded-2xl border border-line bg-surface p-6"><h2 className="mb-3 text-xl font-bold leading-8">{section.heading}</h2><p className="leading-8 text-muted">{section.text}</p></section>)}</div>
    <section aria-labelledby="phrases-heading"><h2 id="phrases-heading" className="mb-4 text-2xl font-bold">عبارات يمكنك استخدامها</h2><ul className="grid gap-4 sm:grid-cols-2">{page.phrases.map(phrase => <li key={phrase.spanish} className="space-y-3 rounded-2xl border border-line bg-surface p-5"><p lang="es" dir="ltr" className="text-start text-xl font-bold">{phrase.spanish}</p><p className="leading-7">{phrase.ar}</p><AudioButton spanish={phrase.spanish} lessonId={page.lesson} /></li>)}</ul></section>
    <section className="rounded-2xl bg-primary/8 p-6"><h2 className="text-2xl font-bold">هل تريد استخدام هذه العبارات بنفسك؟</h2><p className="my-4 leading-8">جرّب المفردات والاستماع والتمارين والحوار ثم أجب عن موقف حقيقي. الدروس الثلاثة مجانية، ويُحفظ تقدّمك على هذا الجهاز.</p><ArabicTrackedLink href={`/ar/lesson/${page.lesson}`} lessonId={page.lesson}>{page.cta}</ArabicTrackedLink></section>
    <section><h2 className="mb-4 text-2xl font-bold">أسئلة شائعة</h2><div className="space-y-4">{page.faq.map(f => <div key={f.q} className="rounded-2xl border border-line p-5"><h3 className="font-bold">{f.q}</h3><p className="mt-2 leading-8 text-muted">{f.a}</p></div>)}</div></section>
    <section><h2 className="mb-4 text-2xl font-bold">دروس أخرى قد تحتاجها في إسبانيا</h2><ul className="grid gap-3 sm:grid-cols-2">{arabicSeoPages.filter(p => p.slug && p.slug !== page.slug).map(p => <li key={p.slug}><Link href={arabicPath(p.slug)} className="block rounded-xl border border-line p-4 text-primary hover:underline">{p.h1}</Link></li>)}</ul></section>
  </ArabicShell>;
}
