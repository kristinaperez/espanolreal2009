import type { SocialPlatform } from "./teacher-posts/share";
export interface ShareSnapshot { id: string; url: string; imageUrl: string; pinterestImageUrl: string }
export function desktopShareUrl(platform: SocialPlatform, data: ShareSnapshot, title: string, text: string): string | null {
 const e = encodeURIComponent; const combined = `${text}\n\n${data.url}`;
 switch (platform) {
  case "Facebook": return `https://www.facebook.com/sharer/sharer.php?u=${e(data.url)}`;
  case "Pinterest": return `https://www.pinterest.com/pin/create/button/?url=${e(data.url)}&media=${e(data.pinterestImageUrl)}&description=${e(text.slice(0,500))}`;
  case "Telegram": return `https://t.me/share/url?url=${e(data.url)}&text=${e(text)}`;
  case "Вконтакте": return `https://vk.com/share.php?url=${e(data.url)}&title=${e(title)}`;
  case "WhatsApp": return `https://wa.me/?text=${e(combined)}`;
  case "Threads": return `https://www.threads.net/intent/post?text=${e(text.slice(0,Math.max(0,500-data.url.length-2))+'\n\n'+data.url)}`;
  case "Max": return `https://max.ru/:share?text=${e(combined)}`;
  default: return null;
 }
}
export function supportsFileShare(file: File | null): boolean {
 try { return !!file && typeof navigator !== "undefined" && !!navigator.share && !!navigator.canShare && navigator.canShare({ files: [file] }); } catch { return false; }
}
/** Invoke share synchronously in the click stack. Clipboard runs first without awaiting it,
 * since awaiting clipboard can consume Safari's transient user activation. */
export function sharePreparedFile(file: File, title: string, text: string, onCopied: () => void, onCopyFailed: () => void): Promise<void> {
 if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(text).then(onCopied,onCopyFailed); else onCopyFailed();
 return navigator.share({ files: [file], title, text });
}
export function downloadShareFile(file: File) {
 const url = URL.createObjectURL(file); const a = document.createElement("a"); a.href = url; a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
}
