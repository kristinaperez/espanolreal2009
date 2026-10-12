import type { Metadata } from "next";
import { SearchView } from "@/components/learn/search-view";
import { getClientPhraseIndex } from "@/lib/content/loader";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Поиск фраз",
  description: "Поиск по всем фразам курса: испанский, русский, теги, уроки и ситуации.",
  alternates: { canonical: "/learn/search" },
};

export default function SearchPage() {
  return <SearchView phrases={getClientPhraseIndex()} />;
}
