import type { Metadata } from "next";
import { BlogEditor } from "@/components/blog/blog-editor";
export const metadata: Metadata = { title: "Редактор блога", robots: { index: false, follow: false } };
export default function BlogAdmin() { return <BlogEditor />; }
