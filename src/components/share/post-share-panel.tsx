"use client";
import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { formatPost, parsePost, type GeneratedPost, type LessonDraft } from "@/lib/teacher-posts/model";
import { preparePostImage, fileDataUrl } from "@/lib/post-image";
import { desktopShareUrl, downloadPostText, downloadShareFile, sharePreparedFile, supportsFileShare, type ShareSnapshot } from "@/lib/share";
import { shareTextParts } from "@/lib/share-parts";
import { shareTranslations } from "@/lib/share-translations";
import type { SocialPlatform } from "@/lib/teacher-posts/share";
import { ShareButton, shareNetworks } from "./share-button";
const button = "min-h-11 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold transition-shadow hover:shadow-md disabled:opacity-40";
export function PostSharePanel({ generated, draft, onNotice }: { generated: GeneratedPost; draft: LessonDraft; onNotice: (message: string) => void }) {
 const { language } = useLanguage(), { user } = useAuth();
 const t = shareTranslations[language];
 const [prepared, setPrepared] = useState<{ key: string; file: File } | null>(null);
 const [failure, setFailure] = useState("");
 const [snapshot, setSnapshot] = useState<{ key: string; data: ShareSnapshot } | null>(null);
 const [publishing, setPublishing] = useState(false), [manual, setManual] = useState("");
 const [exportPlatform, setExportPlatform] = useState<"Threads" | "Pinterest" | null>(null);
 const key = JSON.stringify({ generated, draft, owner: user?.telegramId ?? "guest" });
 const latest = useRef(key);
 useEffect(() => { latest.current = key; }, [key]);
 useEffect(() => {
  let active = true;
  void preparePostImage(generated.post).then(file => { if (active) { setPrepared({ key, file }); setFailure(""); } }, () => { if (active) setFailure(key); });
  return () => { active = false; };
 }, [key, generated.post]);
 const file = prepared?.key === key ? prepared.file : null;
 const data = snapshot?.key === key ? snapshot.data : null;
 const text = formatPost(generated.post, generated.cta), valid = !!parsePost(generated.post);
 const parts = exportPlatform ? shareTextParts(text, exportPlatform, exportPlatform === "Threads" ? data?.url : undefined) : [];
 async function copy(value: string, message: string) {
  try { if (!navigator.clipboard?.writeText) throw Error("clipboard"); await navigator.clipboard.writeText(value); onNotice(message); }
  catch { setManual(value); onNotice(t.manual); }
 }
 async function publish(): Promise<ShareSnapshot | undefined> {
  if (!user) { onNotice(t.login); return; }
  if (!file || publishing) return;
  const version = key; setPublishing(true);
  try {
   const image = await fileDataUrl(file);
   const response = await fetch("/api/teacher/posts/share", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ draft, post: generated.post, mode: generated.mode, image }) });
   const result = await response.json();
   if (!response.ok) throw Error(result.error);
   if (latest.current !== version) return;
   setSnapshot({ key: version, data: result }); onNotice(t.published); return result as ShareSnapshot;
  } catch { onNotice(t.error); } finally { setPublishing(false); }
 }
 function nativeShare(caption: string) {
  if (!supportsFileShare(file)) { onNotice(t.unsupported); return; }
  void sharePreparedFile(file!, generated.post.title, caption, () => onNotice(t.copied), () => { setManual(caption); onNotice(t.manual); }).catch(error => {
   if (error?.name !== "AbortError") { setManual(caption); onNotice(t.error); }
  });
 }
 function openLink(platform: SocialPlatform) {
  const navigate = (result: ShareSnapshot) => desktopShareUrl(platform, result, generated.post.title, text);
  if (data) {
   const target = navigate(data);
   if (target) { const popup = window.open(target, "_blank", "popup,width=720,height=720"); if (popup) popup.opener = null; else onNotice(t.blocked); }
   return;
  }
  if (!user) { onNotice(t.login); return; }
  // Reserve synchronously before uploading, keeping the user's click gesture.
  const popup = window.open("about:blank", "_blank", "popup,width=720,height=720");
  if (!popup) { onNotice(t.blocked); return; }
  popup.opener = null; popup.document.title = t.publishing; popup.document.body.textContent = t.publishing;
  void publish().then(result => { if (!result) { popup.close(); return; } const target = navigate(result); if (target) popup.location.replace(target); else popup.close(); });
 }
 function click(platform?: SocialPlatform) {
  const mobile = window.matchMedia("(max-width: 767px)").matches || navigator.maxTouchPoints > 0;
  if (!platform) { nativeShare(text); return; }
  if (platform === "Threads" || platform === "Pinterest") setExportPlatform(platform);
  // The main button shares a file. Specific link-capable networks open their
  // own composer/chat selector instead of the iOS generic share sheet.
  if (platform === "Instagram") {
   if (mobile) nativeShare(text); else { if (file) downloadShareFile(file); void copy(text, t.instagram); }
   return;
  }
  if (platform === "Threads" && mobile) {
   nativeShare(shareTextParts(text, "Threads", data?.url)[0]); return;
  }
  openLink(platform);
 }
 return <section aria-label={t.share} className="mt-6 space-y-4">
  <h3 className="text-sm font-extrabold">{t.share}</h3>
  <button type="button" disabled={!file || !valid || publishing} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#9E2A2B] px-5 py-3 font-bold text-white transition-shadow hover:shadow-md disabled:opacity-40 md:hidden" onClick={() => click()}><Share2 size={20} />{t.share}</button>
  <div className="flex flex-wrap gap-2">{shareNetworks.map(network => <ShareButton key={network.name} network={network} disabled={!valid || !file || publishing} onClick={click} />)}</div>
  {!file && <p role="status" className="text-sm">{failure === key ? t.unavailable : t.preparing}</p>}
  <p className="text-xs leading-5 text-stone-500 md:hidden">{t.fileHint}</p>
  {publishing && <p role="status">{t.publishing}</p>}
  <div className="flex flex-wrap gap-2">
   <button type="button" className={button} disabled={publishing || !file || !valid} onClick={() => { if (data) void copy(data.url, t.linkCopied); else void publish().then(result => { if (result) void copy(result.url, t.linkCopied); }); }}>{t.copyLink}</button>
   <button type="button" className={button} disabled={!valid} onClick={() => void copy(text, t.copied)}>{t.copyText}</button>
   <button type="button" className={button} disabled={!file} onClick={() => { if (file) downloadShareFile(file); }}>{t.download}</button>
   <button type="button" className={button} onClick={() => downloadPostText(text)}>{t.downloadText}</button>
  </div>
  <div className="flex flex-wrap gap-2">{(["Threads", "Pinterest"] as const).map(platform => <button type="button" key={platform} className={button} aria-pressed={exportPlatform === platform} onClick={() => setExportPlatform(platform)}>{t.parts(platform)}</button>)}</div>
  {exportPlatform && <div role="region" className="space-y-3 rounded-2xl border border-stone-200 bg-[#FAF8F5] p-4" aria-label={t.parts(exportPlatform)}>
   <p className="text-sm text-stone-600">{exportPlatform === "Threads" ? t.threadHint : t.pinHint}</p>
   {parts.map((part, i) => <div key={i} className="space-y-2">
    <label className="block text-sm font-bold">{i + 1}/{parts.length} · {part.length} {t.characters}<textarea readOnly value={part} onFocus={e => e.target.select()} rows={5} className="mt-2 w-full rounded-xl border border-stone-200 bg-white p-3 font-normal" /></label>
    <button type="button" className={button} onClick={() => void copy(part, t.copied)}>{t.copyPart(i + 1)}</button>
    {exportPlatform === "Threads" && <button type="button" className={`${button} ml-2`} onClick={() => { const popup = window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(part)}`, "_blank", "popup,width=720,height=720"); if (popup) popup.opener = null; else onNotice(t.blocked); }}>{t.openThreads}</button>}
   </div>)}
  </div>}
  {data && <a className="block break-all text-sm font-bold text-[#9E2A2B]" href={data.url} target="_blank" rel="noopener noreferrer">{data.url}</a>}
  {manual && <label className="block text-sm">{t.manual}<textarea readOnly value={manual} onFocus={e => e.target.select()} className="mt-2 w-full rounded-xl border p-3" rows={5} /></label>}
 </section>;
}
