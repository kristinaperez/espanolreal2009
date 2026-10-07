import type { Metadata } from "next";
import { LandingPageContent } from "@/components/landing/landing-page";
import { getCourseStats, getLessonMetas } from "@/lib/content/loader";
import { publicFaq } from "@/lib/seo/public-faq";

export const metadata: Metadata = {
  title: "Español Real — живой испанский для жизни в Испании",
  description:
    "Тренажёр разговорного испанского для жизни в Испании: реальные фразы вместо заучивания грамматики, 45 уроков, практика и интервальное повторение.",
  keywords: [
    "испанский для жизни в Испании",
    "разговорный испанский",
    "испанский для эмигрантов",
    "испанский для жизни",
    "тренажёр испанского",
    "живой испанский",
    "Español Real",
  ],
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  const stats = getCourseStats();
  const siteUrl = "https://espanolreal.es";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Course", "@id": `${siteUrl}/#course`, name: "Español Real", url: siteUrl, description: "Тренажёр разговорного испанского для жизни в Испании: реальные фразы, 45 уроков, практика и повторение.", inLanguage: ["ru", "es"], educationalLevel: ["A1", "A2", "B1", "B2"], creator: { "@type": "Person", name: "Cristina Pérez", url: `${siteUrl}/about-author` } },
      { "@type": "WebApplication", "@id": `${siteUrl}/#application`, name: "Español Real", url: siteUrl, applicationCategory: "EducationalApplication", operatingSystem: "Web", inLanguage: "ru", description: "Интерактивный тренажёр живого испанского языка для жизни в Испании." },
      { "@type": "FAQPage", "@id": `${siteUrl}/#faq`, mainEntity: publicFaq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) },
    ],
  };
  const milestoneCounts = getLessonMetas().reduce<Record<string, number>>((acc, lesson) => {
    acc[lesson.milestone] = (acc[lesson.milestone] ?? 0) + 1;
    return acc;
  }, {});
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><LandingPageContent stats={stats} milestoneCounts={milestoneCounts} faq={publicFaq} /></>;
}
