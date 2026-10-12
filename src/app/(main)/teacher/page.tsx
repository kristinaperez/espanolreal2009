import type { Metadata } from "next";
import { TeacherDashboard } from "@/components/teacher-posts/teacher-dashboard";
export const metadata: Metadata = { title: "Преподавателям", description: "Кабинет преподавателя Español Real для создания учебных материалов.", alternates: { canonical: "/teacher" }, robots: { index: false, follow: true } };
export default function Page() { return <TeacherDashboard />; }
