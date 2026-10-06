import type { Metadata } from "next";
import { TeacherPostGenerator } from "@/components/teacher-posts/teacher-post-generator";
export const metadata: Metadata = { title: "Публикация из кабинета — Español Real", robots: { index: false, follow: true } };
export default function Page() { return <TeacherPostGenerator publicationInCabinet />; }
