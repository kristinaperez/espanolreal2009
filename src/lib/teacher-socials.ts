import { socialPlatforms, type SocialPlatform } from "./teacher-posts/share";
export type TeacherSocialLinks = Partial<Record<SocialPlatform, string>>;
const hosts: Record<SocialPlatform, string[]> = {
 Telegram: ["t.me", "telegram.me"], Instagram: ["instagram.com"], Threads: ["threads.net", "threads.com"],
 Facebook: ["facebook.com", "fb.com"], Max: ["max.ru"], "Вконтакте": ["vk.com", "vk.ru"],
 WhatsApp: ["wa.me", "whatsapp.com"], Pinterest: ["pinterest.com", "pinterest.es"],
};
export function parseTeacherSocialLinks(value: unknown): TeacherSocialLinks | null {
 if (!value || typeof value !== "object" || Array.isArray(value)) return null;
 const output: TeacherSocialLinks = {};
 for (const [name, raw] of Object.entries(value)) {
  if (!socialPlatforms.includes(name as SocialPlatform) || typeof raw !== "string" || raw.length > 2048) return null;
  if (!raw.trim()) continue;
  try {
   const url = new URL(raw.trim()), network = name as SocialPlatform;
   const domain = url.hostname.toLowerCase();
   if (url.protocol !== "https:" || url.username || url.password || url.port || !hosts[network].some(host => domain === host || domain.endsWith(`.${host}`)) || url.pathname === "/") return null;
   output[network] = url.toString();
  } catch { return null; }
 }
 return output;
}
