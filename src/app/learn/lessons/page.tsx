import type { Metadata } from "next";
import Link from "next/link";
import { LessonList } from "@/components/learn/lesson-list";
import { getExamBlocks } from "@/lib/content/loader";
import { topics } from "@/lib/seo/topics";

export const metadata: Metadata = {
  title: "Уроки",
  description: "Все уроки курса Español Real: повседневный испанский, жильё, банк, врач, документы, работа и общение.",
  alternates: { canonical: "/learn/lessons" },
};

export default function LessonsPage() {
  const blocks = getExamBlocks().map((block) => ({
    block: block.block,
    fromLesson: block.fromLesson,
    toLesson: block.toLesson,
    phraseCount: block.phraseCount,
  }));
  return <><section className="mb-6 rounded-3xl border border-line bg-surface p-5"><h2 className="text-lg font-extrabold">Уроки по жизненным ситуациям</h2><p className="mt-2 text-sm text-muted">Откройте тематическую подборку или выберите отдельный урок ниже.</p><nav aria-label="Тематические подборки" className="mt-4 flex flex-wrap gap-2">{topics.map((topic) => <Link key={topic.slug} href={`/topics/${topic.slug}`} className="rounded-full border border-line bg-background-soft px-3 py-2 text-sm font-bold text-primary">{topic.title}</Link>)}</nav></section><LessonList examBlocks={blocks} /></>;
}
