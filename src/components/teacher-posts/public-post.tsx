"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HeaderNavUpdate } from "@/components/layout/header-nav-update";
import { parsePost, safePostUrl, type TeacherPost } from "@/lib/teacher-posts/model";
import { PostPreview } from "./post-preview";
export function PublicPost() {
  const [post, setPost] = useState<TeacherPost | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const slug = new URLSearchParams(window.location.search).get("slug") ?? "";
    void fetch(`/api/teacher/posts/public?${new URLSearchParams({ slug })}`, { signal: controller.signal, cache: "no-store" }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Пост не найден");
      const content = parsePost(data.post);
      if (!content) throw new Error("Не удалось прочитать пост.");
      setPost({ ...data, post: content, cta: data.cta && safePostUrl(data.cta.url) ? data.cta : null });
    }).catch(e => { if (e.name !== "AbortError") setError(e instanceof Error ? e.message : "Не удалось загрузить пост."); });
    return () => controller.abort();
  }, []);
  return <div className="min-h-dvh bg-[#FAF8F5] text-stone-900"><HeaderNavUpdate /><main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{error ? <p role="alert" className="rounded-2xl bg-white p-6">{error}</p> : post ? <><p className="mb-4 text-sm text-stone-600">Пост преподавателя · {post.authorName}</p>{post.mode === "mock" && <p className="mb-4 text-xs text-stone-500">Создано в тестовом шаблонном режиме.</p>}<PostPreview post={post.post} cta={post.cta} /></> : <p role="status">Загружаем пост…</p>}<Link href="/teacher/posts/new" className="mt-6 inline-flex min-h-11 items-center font-bold text-[#9E2A2B]">Создать свой WOW-пост →</Link></main></div>;
}
