import type { Metadata } from "next";
import { PublicPost } from "@/components/teacher-posts/public-post";
export const metadata: Metadata = { title: "Пост преподавателя — Español Real", robots: { index: false, follow: true } };
export default function Page() { return <PublicPost />; }
