import type { MetadataRoute } from "next";
import { getExamBlocks, getLessonNumbers } from "@/lib/content/loader";

// Required for `output: "export"` builds.
export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://espanolreal.es";

/**
 * Public, indexable URLs only.
 *
 * Lessons are generated from the real lesson JSON files, so the sitemap stays
 * in sync when new lessons are added. Private/app-only pages such as /learn,
 * /learn/review, /learn/mistakes, /learn/search, /learn/settings, /learn/stats
 * and /certificate are intentionally excluded because they are noindex.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/learn/lessons`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/learn/map`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/learn/about`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const lessonRoutes: MetadataRoute.Sitemap = getLessonNumbers().map((lesson) => ({
    url: `${siteUrl}/lesson/${lesson}`,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  const examRoutes: MetadataRoute.Sitemap = getExamBlocks().map((block) => ({
    url: `${siteUrl}/exam/${block.block}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...lessonRoutes, ...examRoutes];
}
