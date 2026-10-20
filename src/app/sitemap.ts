import { listArticles } from "@/server/blog";
import { publishedStories } from "@/lib/stories";
import { arabicSeoPages, arabicPath } from "@/lib/arabic/seo-content";
import type { MetadataRoute } from "next";
import { getLessonNumbers } from "@/lib/content/loader";
import { topics } from "@/lib/seo/topics";

// Required for `output: "export"` builds.
export const dynamic = "force-dynamic";

const siteUrl = "https://espanolreal.es";

/**
 * Public, indexable URLs only.
 *
 * Lessons are generated from the real lesson JSON files, so the sitemap stays
 * in sync when new lessons are added. Private/app-only pages such as /learn,
 * /learn/review, /learn/mistakes, /learn/search, /learn/settings, /learn/stats
 * and /certificate are intentionally excluded because they are noindex.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await listArticles();
  const blogRoutes: MetadataRoute.Sitemap = [{ url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.7 }, ...articles.map(article => ({ url: `${siteUrl}/blog/${article.slug}`, lastModified: article.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 }))];
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/learn/lessons`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/learn/map`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/learn/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/for-teachers`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/about-author`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contacts`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const topicRoutes: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${siteUrl}/topics/${topic.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const lessonRoutes: MetadataRoute.Sitemap = getLessonNumbers().map((lesson) => ({
    url: `${siteUrl}/lesson/${lesson}`,
    changeFrequency: "monthly",
    priority: 0.9,
  }));


  const arabicRoutes: MetadataRoute.Sitemap = arabicSeoPages.map(page => ({ url: `${siteUrl}${arabicPath(page.slug)}`, changeFrequency: "monthly", priority: page.slug ? 0.7 : 0.9 }));
  const storyRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/ru/100-prichin-uchit-ispanskiy/`, changeFrequency: "weekly", priority: 0.7 },
    ...publishedStories.map(story => ({ url: `${siteUrl}/ru/zachem-uchit-ispanskiy/${story.slug}/`, lastModified: new Date(story.updatedAt), changeFrequency: "monthly" as const, priority: 0.6 }))
  ];
  return [...blogRoutes, ...staticRoutes, ...topicRoutes, ...lessonRoutes, ...arabicRoutes, ...storyRoutes];
}
