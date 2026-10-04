export type TeacherLinkKind = "calendly" | "telegram" | "whatsapp" | "vk";
const hosts: Record<TeacherLinkKind, string[]> = {
  calendly: ["calendly.com", "www.calendly.com"],
  telegram: ["t.me"],
  whatsapp: ["wa.me", "api.whatsapp.com"],
  vk: ["vk.com", "www.vk.com"],
};
/** Reject javascript:, lookalike hosts, userinfo, custom ports and control characters. */
export function safeTeacherUrl(value: string | undefined, kind: TeacherLinkKind): string | undefined {
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value)) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || !hosts[kind].includes(url.hostname)) return undefined;
    if (url.pathname === "/") return undefined;
    return url.href;
  } catch { return undefined; }
}
