import type { Metadata } from "next";
import { TeacherDashboard } from "@/components/teacher-posts/teacher-dashboard";
export const metadata: Metadata = { title: "Преподавателям — Español Real", robots: { index: false, follow: true } };
export default function Page() { return <TeacherDashboard />; }
