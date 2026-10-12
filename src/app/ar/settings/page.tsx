import { ArabicShell } from "@/components/arabic/shell";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
export const metadata = { title: "الإعدادات", robots: { index: false, follow: true } };
export default function ArabicSettings() {
  return <ArabicShell><h1 className="text-3xl font-bold">الإعدادات</h1><section className="space-y-4 rounded-2xl border border-line p-6"><h2 className="text-xl font-bold">لغة الواجهة</h2><LanguageSwitcher allLanguages /><p className="text-sm leading-7">النسخة الفرنسية تجريبية. الدروس العربية الثلاثة مجانية.</p></section></ArabicShell>;
}
