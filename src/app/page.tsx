import type { Metadata } from "next";
import { LandingPageContent } from "@/components/landing/landing-page";
import { getCourseStats, getLessonMetas } from "@/lib/content/loader";

export const metadata: Metadata = {
  title: "Español Real — живой испанский для жизни в Испании",
  description: "Учите реальные фразы вместо грамматики. 45 уроков по авторскому учебнику для жизни в Испании.",
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
