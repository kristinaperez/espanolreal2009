export interface ArticleInput { slug: string; title: string; description: string; body: string; published: boolean }
export interface Article extends ArticleInput { createdAt: string; updatedAt: string }
export function validSlug(slug: string) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 100; }
export function parseArticle(value: unknown): ArticleInput | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.slug !== "string" || !validSlug(v.slug) || typeof v.published !== "boolean") return null;
  for (const [key, min, max] of [["title", 3, 160], ["description", 10, 300], ["body", 20, 50000]] as const) {
    if (typeof v[key] !== "string" || v[key].trim().length < min || v[key].length > max) return null;
  }
  return { slug: v.slug, title: (v.title as string).trim(), description: (v.description as string).trim(), body: (v.body as string).trim(), published: v.published };
}
