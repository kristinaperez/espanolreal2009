import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { telegramUsers } from "./schema";
export const learningTrials = pgTable("learning_trials", {
  id: text("id").primaryKey(),
  userId: integer("user_id").unique().references(() => telegramUsers.id),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
export const blogArticles = pgTable("blog_articles", {
  slug: text("slug").primaryKey(), title: text("title").notNull(),
  description: text("description").notNull(), body: text("body").notNull(),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
