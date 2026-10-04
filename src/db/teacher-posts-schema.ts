import { sql } from "drizzle-orm";
import { check, bigint, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { PostCta, WowPost } from "@/lib/teacher-posts/model";
/** Independent author identity; no writes to course, billing or TeacherLesson tables. */
export const teacherPostAuthors = pgTable("teacher_post_authors", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegramId: bigint("telegram_id", { mode: "number" }).notNull().unique(),
  displayName: text("display_name").notNull(),
  lessonsUrl: text("lessons_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const teacherPosts = pgTable("teacher_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id").notNull().references(() => teacherPostAuthors.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("published"),
  post: jsonb("post").$type<WowPost>().notNull(),
  cta: jsonb("cta").$type<PostCta | null>(),
  mode: text("mode").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("teacher_posts_author_idx").on(t.authorId), check("teacher_posts_status_check", sql`${t.status} IN ('published')`), check("teacher_posts_mode_check", sql`${t.mode} IN ('ai', 'mock')`)]);
