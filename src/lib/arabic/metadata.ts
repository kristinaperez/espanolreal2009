import type { Metadata } from "next";
import { site } from "@/lib/seo/site";
import { arabicPath, type ArabicSeoContent } from "./seo-content";
export function arabicMetadata(page: ArabicSeoContent): Metadata {
  const url = `${site.url}${arabicPath(page.slug)}`;
  return {
    title: { absolute: page.title }, description: page.description,
    alternates: { canonical: url, languages: page.slug ? { ar: url } : { ar: url, ru: `${site.url}/`, "x-default": `${site.url}/` } },
    openGraph: { title: page.title, description: page.description, url, locale: "ar_AR", type: "website", siteName: site.name, images: [{ url: "/ar-og.png", width: 1200, height: 630, alt: "تعلم الإسبانية للحياة في إسبانيا" }] },
    twitter: { card: "summary_large_image", title: page.title, description: page.description, images: ["/ar-og.png"] },
    robots: { index: true, follow: true },
  };
}
