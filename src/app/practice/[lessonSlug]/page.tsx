import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicTeacherLesson, getPublicTeachers } from "@/server/teacher/repository";
import { TeacherAttribution, TeacherPageFrame, TeacherView } from "@/components/teacher/public-ui";
import { TeacherPractice } from "@/components/teacher/practice";
import { Card } from "@/components/ui/card";
export const dynamicParams = false;
export function generateStaticParams() { return [{ lessonSlug: "demo-pedir-en-un-cafe" }]; }
type Props = { params: Promise<{ lessonSlug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = getPublicTeacherLesson((await params).lessonSlug);
  if (!lesson) return { title: "Урок не найден", robots: { index: false, follow: true } };
  // Phase 1 is always noindex, including any accidentally marked index fixture.
  return { title: lesson.seoTitle, description: lesson.seoDescription,
    robots: { index: false, follow: true }, alternates: { canonical: lesson.canonicalUrl },
    openGraph: { title: lesson.title, description: lesson.summary, url: lesson.canonicalUrl, type: "website" },
    twitter: { card: "summary", title: lesson.title, description: lesson.summary },
  };
}
export default async function TeacherLessonPage({ params }: Props) {
  const lesson = getPublicTeacherLesson((await params).lessonSlug);
  if (!lesson) notFound();
  const teacher = getPublicTeachers().find(item => item.id === lesson.teacherId);
  if (!teacher) notFound();
  const context = { teacher_id: teacher.id, lesson_id: lesson.id, lesson_slug: lesson.slug, topic: lesson.topic, level: lesson.level, seo_status: lesson.seoStatus, source_page: `/practice/${lesson.slug}` };
  return <TeacherPageFrame><TeacherView event="teacher_lesson_view" context={context}/><p className="text-sm font-bold text-muted">Демонстрационный урок преподавателя</p><h1 className="text-3xl font-black sm:text-4xl">{lesson.title}</h1><p className="text-lg font-semibold">{lesson.subtitle}</p><p>{lesson.summary}</p><p className="text-sm font-bold text-muted">{lesson.level} · {lesson.topic} · {lesson.estimatedMinutes} минут</p><TeacherAttribution teacher={teacher} context={context}/><Card className="space-y-4 p-6"><h2 className="text-xl font-black">Короткое объяснение</h2><p className="leading-relaxed">{lesson.explanation}</p>{lesson.contentBlocks.map(block => block.type === "text" ? <p key={block.id}>{block.text}</p> : <div key={block.id} className="rounded-2xl bg-background-soft p-4"><p lang="es" className="text-lg font-bold">{block.spanish}</p><p className="mt-1 text-muted">{block.translation}</p>{block.note ? <p>{block.note}</p> : null}</div>)}</Card><TeacherPractice lesson={lesson} teacher={teacher} context={context}/></TeacherPageFrame>;
}
