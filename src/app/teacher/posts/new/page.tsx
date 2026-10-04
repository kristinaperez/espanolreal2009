import type { Metadata } from "next";
import { TeacherPostGenerator } from "@/components/teacher-posts/teacher-post-generator";
export const metadata: Metadata = { title: "Генератор WOW-постов — Español Real", robots: { index: false, follow: true } };
export default function Page() { return <TeacherPostGenerator />; }
