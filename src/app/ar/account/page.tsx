import { ArabicShell } from "@/components/arabic/shell";
import { ArabicAccount } from "@/components/arabic/account";
export const metadata = { title: "الحساب وتسجيل الدخول", description: "حساب EspañolReal وتسجيل الدخول عبر Telegram.", robots: { index: false, follow: true }, alternates: { canonical: "/ar/account", languages: { ar: "/ar/account" } } };
export default function AccountPage() { return <ArabicShell><h1 className="text-3xl font-black">الحساب وتسجيل الدخول</h1><ArabicAccount /></ArabicShell>; }
