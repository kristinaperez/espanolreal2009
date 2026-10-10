import { arabicMetadata } from "@/lib/arabic/metadata";
import { arabicSeoPages } from "@/lib/arabic/seo-content";
import type { ReactNode } from "react";
import { LocaleRoot, metadata as baseMetadata } from "../root-shell";
export { viewport } from "../root-shell";
export const metadata = { ...baseMetadata, ...arabicMetadata(arabicSeoPages[0]), title: { default: "تعلم الإسبانية للحياة في إسبانيا — EspañolReal", template: "%s | EspañolReal" }, description: "تعلم الإسبانية بالعربية من خلال مواقف حقيقية في إسبانيا.", keywords: ["تعلم الإسبانية", "الإسبانية بالعربية", "الإسبانية في إسبانيا"] };
export default function ArabicLayout({ children }: { children: ReactNode }) { return <LocaleRoot language="ar">{children}</LocaleRoot>; }
