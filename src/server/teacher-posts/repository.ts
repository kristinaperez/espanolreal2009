import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { teacherPostAuthors, teacherPosts } from "@/db/teacher-posts-schema";
import type { GeneratedPost, LessonDraft, TeacherPost } from "@/lib/teacher-posts/model";
import type { TelegramUserRow } from "@/db/schema";
export async function publishPost(user: TelegramUserRow, draft: LessonDraft, generated: GeneratedPost): Promise<TeacherPost> {
  const authorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Преподаватель";
  return db.transaction(async tx => {
    const [author] = await tx.insert(teacherPostAuthors).values({ telegramId: user.telegramId, displayName: authorName, lessonsUrl: draft.teacherLessonsUrl || null }).onConflictDoUpdate({ target: teacherPostAuthors.telegramId, set: { displayName: authorName, lessonsUrl: draft.teacherLessonsUrl || null } }).returning({ id: teacherPostAuthors.id });
    const slug = `post-${randomUUID()}`;
    const [row] = await tx.insert(teacherPosts).values({ authorId: author.id, slug, post: generated.post, cta: generated.cta, mode: generated.mode }).returning({ publishedAt: teacherPosts.publishedAt });
    return { ...generated, slug, authorName, status: "published", publishedAt: row.publishedAt.toISOString() };
  });
}
export async function publicPost(slug: string): Promise<TeacherPost | null> {
  const [row] = await db.select({ slug: teacherPosts.slug, post: teacherPosts.post, cta: teacherPosts.cta, mode: teacherPosts.mode, publishedAt: teacherPosts.publishedAt, authorName: teacherPostAuthors.displayName }).from(teacherPosts).innerJoin(teacherPostAuthors, eq(teacherPosts.authorId, teacherPostAuthors.id)).where(and(eq(teacherPosts.slug, slug), eq(teacherPosts.status, "published"))).limit(1);
  return row ? { ...row, mode: row.mode === "ai" ? "ai" : "mock", publishedAt: row.publishedAt.toISOString(), status: "published" } : null;
}
