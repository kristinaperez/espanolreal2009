import { relations } from "drizzle-orm";
import { index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { ContentBlock, TeacherQuestion } from "@/lib/teacher/types";

export const teacherStatus = pgEnum("teacher_status", ["active", "inactive"]);
export const teacherLessonStatus = pgEnum("teacher_lesson_status", ["draft", "published"]);
export const teacherSeoStatus = pgEnum("teacher_seo_status", ["pending", "index", "noindex"]);
export const teachers = pgTable("teachers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  photoUrl: text("photo_url").notNull(),
  bio: text("bio"),
  lessonRate: numeric("lesson_rate", { precision: 10, scale: 2, mode: "number" }),
  currency: text("currency"),
  calendlyUrl: text("calendly_url"),
  telegramUrl: text("telegram_url"),
  whatsappUrl: text("whatsapp_url"),
  vkUrl: text("vk_url"),
  status: teacherStatus("status").notNull().default("inactive"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const teacherLessons = pgTable("teacher_lessons", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull().references(() => teachers.id, { onDelete: "restrict" }),
  slug: text("slug").notNull().unique(),
  status: teacherLessonStatus("status").notNull().default("draft"),
  title: text("title").notNull(), subtitle: text("subtitle").notNull(),
  summary: text("summary").notNull(), explanation: text("explanation").notNull(),
  topic: text("topic").notNull(), level: text("level").notNull(), language: text("language").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  contentBlocks: jsonb("content_blocks").$type<ContentBlock[]>().notNull(),
  questions: jsonb("questions").$type<TeacherQuestion[]>().notNull(),
  sourceText: text("source_text"), sourceUrl: text("source_url"),
  seoTitle: text("seo_title").notNull(), seoDescription: text("seo_description").notNull(),
  searchIntent: text("search_intent"),
  seoStatus: teacherSeoStatus("seo_status").notNull().default("pending"),
  indexReason: text("index_reason"), canonicalUrl: text("canonical_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("teacher_lessons_teacher_idx").on(table.teacherId)]);
export const teachersRelations = relations(teachers, ({ many }) => ({ lessons: many(teacherLessons) }));
export const teacherLessonsRelations = relations(teacherLessons, ({ one }) => ({
  teacher: one(teachers, { fields: [teacherLessons.teacherId], references: [teachers.id] }),
}));
