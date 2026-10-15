import type { Metadata } from "next";
import { WorldTrainer } from "@/components/world/world-trainer";
import "./world.css";

export const metadata: Metadata = {
  title: "Построй свой мир на испанском",
  description: "Одна фраза, один маленький шаг. Построй свой первый дом на испанском.",
  alternates: { canonical: "/ru/world" },
  robots: { index: false, follow: true },
};
export default function WorldPage() { return <WorldTrainer />; }
