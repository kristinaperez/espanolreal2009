import type { Metadata } from "next";
import { SettingsView } from "@/components/learn/settings-view";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Настройки",
  description: "Тема, цель на день, оплата Premium звёздами Telegram и резервная копия прогресса.",
  alternates: { canonical: "/learn/settings" },
};

export default function SettingsPage() {
  return <SettingsView />;
}
