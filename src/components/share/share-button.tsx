"use client";
import type { CSSProperties } from "react";
import { SiTelegram, SiInstagram, SiThreads, SiFacebook, SiMax, SiVk, SiWhatsapp, SiPinterest } from "react-icons/si";
import { useLanguage } from "@/components/providers/language-provider";
import { shareTranslations } from "@/lib/share-translations";
import type { SocialPlatform } from "@/lib/teacher-posts/share";
// react-icons 5.7.0 (MIT wrapper), Simple Icons artwork (CC0-1.0).
// Includes SiThreads and SiMax (MAX messenger, source https://max.ru, not HBO Max).
export const shareNetworks = [
 { name: "Telegram", Icon: SiTelegram, color: "#26A5E4" }, { name: "Instagram", Icon: SiInstagram, color: "#E4405F" },
 { name: "Threads", Icon: SiThreads, color: "#000000" }, { name: "Facebook", Icon: SiFacebook, color: "#0866FF" },
 { name: "Max", Icon: SiMax, color: "#4F40FF" }, { name: "Вконтакте", Icon: SiVk, color: "#0077FF" },
 { name: "WhatsApp", Icon: SiWhatsapp, color: "#25D366" }, { name: "Pinterest", Icon: SiPinterest, color: "#BD081C" },
] as const;
export function ShareButton({ network, disabled, onClick }: { network: typeof shareNetworks[number]; disabled?: boolean; onClick: (platform: SocialPlatform) => void }) {
 const { language } = useLanguage(); const label = shareTranslations[language].label(network.name === "Вконтакте" ? "ВКонтакте" : network.name);
 return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={() => onClick(network.name)} style={{ "--share-color": network.color } as CSSProperties} className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition-colors hover:text-[var(--share-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9E2A2B] disabled:opacity-40"><network.Icon size={24} aria-hidden /></button>;
}
