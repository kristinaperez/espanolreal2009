import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicTeacher, getPublicTeacherLessons, getPublicTeachers } from "@/server/teacher/repository";
import { TeacherContacts, TeacherPageFrame, TeacherView } from "@/components/teacher/public-ui";
import { Card } from "@/components/ui/card";
export const dynamicParams = false;
export function generateStaticParams() { return getPublicTeachers().map(teacher => ({ teacherSlug: teacher.slug })); }
type Props = { params: Promise<{ teacherSlug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const teacher = getPublicTeacher((await params).teacherSlug);
  return { title: teacher?.displayName ?? "Преподаватель не найден", robots: { index: false, follow: true },
    alternates: { canonical: teacher ? `/teachers/${teacher.slug}` : "/teachers" },
    openGraph: { title: teacher?.displayName ?? "Учителя", url: teacher ? `/teachers/${teacher.slug}` : "/teachers" },
    twitter: { card: "summary", title: teacher?.displayName ?? "Учителя" },
  };
}
export default async function TeacherProfilePage({ params }: Props) {
  const teacher = getPublicTeacher((await params).teacherSlug);
  if (!teacher) notFound();
  const context = { teacher_id: teacher.id, source_page: `/teachers/${teacher.slug}` };
  const lessons = getPublicTeacherLessons(teacher.id);
  return <TeacherPageFrame><TeacherView event="teacher_profile_view" context={context}/><Link href="/teachers" className="font-bold text-primary">← Учителя</Link><Card className="space-y-5 p-6"><Image src={teacher.photoUrl} alt={`Аватар: ${teacher.displayName}`} width={96} height={96} className="rounded-full"/><h1 className="text-3xl font-black">{teacher.displayName}</h1>{teacher.bio ? <p>{teacher.bio}</p> : null}{teacher.lessonRate !== undefined ? <p className="font-bold">Демонстрационная ставка: {teacher.lessonRate} {teacher.currency} / занятие</p> : null}<TeacherContacts teacher={teacher} context={context}/>{!teacher.calendlyUrl ? <p className="text-sm text-muted">В тестовом профиле запись на занятия пока не настроена.</p> : null}</Card><h2 className="text-2xl font-black">Уроки преподавателя</h2>{lessons.map(lesson => <Link key={lesson.id} href={`/practice/${lesson.slug}`} className="block rounded-3xl border border-line bg-surface p-6 hover:border-primary"><h3 className="text-xl font-bold">{lesson.title}</h3><p className="mt-2 text-sm text-muted">{lesson.topic} · {lesson.level} · {lesson.estimatedMinutes} минут</p></Link>)}</TeacherPageFrame>;
}
