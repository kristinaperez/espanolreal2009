import type { Metadata } from "next";
import { StatsView } from "@/components/learn/stats-view";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Статистика",
  description: "XP, серия дней, точность ответов, календарь занятий и достижения курса Español Real.",
  alternates: { canonical: "/learn/stats" },
};

export default function StatsPage() {
  return <StatsView />;
}
