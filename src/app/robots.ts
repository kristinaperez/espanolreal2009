import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const siteUrl = "https://espanolreal.es";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] },
      // Explicitly allow ChatGPT search discovery. This is separate from GPTBot/training access.
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/api/", "/admin/"] },
      { userAgent: "Googlebot", allow: "/", disallow: ["/api/", "/admin/"] },
      { userAgent: "Bingbot", allow: "/", disallow: ["/api/", "/admin/"] },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
