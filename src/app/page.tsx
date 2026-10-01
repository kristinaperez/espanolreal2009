import type { Metadata } from "next";
import { LandingPageContent } from "@/components/landing/landing-page";
import { getCourseStats, getLessonMetas } from "@/lib/content/loader";

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
  const milestoneCounts = getLessonMetas().reduce<Record<string, number>>((acc, lesson) => {
    acc[lesson.milestone] = (acc[lesson.milestone] ?? 0) + 1;
    return acc;
  }, {});
  return <LandingPageContent stats={stats} milestoneCounts={milestoneCounts} />;
}
