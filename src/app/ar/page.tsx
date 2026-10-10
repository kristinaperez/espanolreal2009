import { ArabicSeoPage } from "@/components/arabic/seo-page";
import { arabicSeoPages } from "@/lib/arabic/seo-content";
import { arabicMetadata } from "@/lib/arabic/metadata";
export const metadata = arabicMetadata(arabicSeoPages[0]);
export default function ArabicHome() { return <ArabicSeoPage page={arabicSeoPages[0]} />; }
