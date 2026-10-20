import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogArticles } from "@/db/blog-schema";
export function isBlogAdmin(telegramId?: number) {
  if (!telegramId) return false;
  return (process.env.BLOG_ADMIN_TELEGRAM_IDS ?? "").split(",").map(id => id.trim()).includes(String(telegramId));
}
export async function listArticles(includeDrafts = false) {
  if (!process.env.DATABASE_URL) return [];
  return db.select().from(blogArticles).where(includeDrafts ? undefined : eq(blogArticles.published, true)).orderBy(desc(blogArticles.updatedAt));
}
export async function getArticle(slug: string) {
  if (!process.env.DATABASE_URL) return null;
  const [article] = await db.select().from(blogArticles).where(eq(blogArticles.slug, slug)).limit(1);
  return article?.published ? article : null;
}
