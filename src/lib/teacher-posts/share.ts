export const socialPlatforms = ["Telegram", "Instagram", "Threads", "Facebook", "Max", "Вконтакте", "WhatsApp", "Pinterest"] as const;
export type SocialPlatform = typeof socialPlatforms[number];
/** Platforms without a verified generic text intent use native share/copy. */
export function shareUrl(platform: SocialPlatform, text: string, url: string): string | null {
  if (platform === "Telegram" && url) return `https://t.me/share/url?${new URLSearchParams({ url, text })}`;
  if (platform === "WhatsApp") return `https://wa.me/?${new URLSearchParams({ text: [text, url].filter(Boolean).join("\n\n") })}`;
  return null;
}
