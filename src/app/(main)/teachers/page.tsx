import Link from "next/link";
import type { Metadata } from "next";
import { getPublicTeachers } from "@/server/teacher/repository";
import { TeacherPageFrame } from "@/components/teacher/public-ui";
export const metadata: Metadata = { title: "Учителя", description: "Уроки и профили преподавателей EspanolReal. Тестовый раздел.", robots: { index: false, follow: true }, alternates: { canonical: "/teachers" }, openGraph: { title: "Учителя EspanolReal", url: "/teachers" }, twitter: { card: "summary", title: "Учителя EspanolReal" } };
/** Minimal discovery entry, not the searchable Phase 2/4 marketplace. */
export default function TeachersPage() {
  return <TeacherPageFrame><h1 className="text-3xl font-black">Учителя</h1><p className="text-muted">Тестовый раздел: познакомьтесь с форматом урока преподавателя.</p>{getPublicTeachers().map(teacher => <Link href={`/teachers/${teacher.slug}`} key={teacher.id} className="block rounded-3xl border border-line bg-surface p-6"><h2 className="text-xl font-bold">{teacher.displayName} →</h2><p className="mt-2">{teacher.bio}</p></Link>)}</TeacherPageFrame>;
}
