"use client";
import { useState } from "react";
import { Clock3, MessageCircle, Mic, Wallet } from "lucide-react";
import type { VisualHook as VisualPlan } from "@/lib/teacher-posts/model";
const icons = { wallet: Wallet, clock: Clock3, memory: Mic, reaction: MessageCircle };
function Cat({ surprised = false }: { surprised?: boolean }) {
  return <svg viewBox="0 0 120 120" className="h-28 w-28" fill="#fffaf4" stroke="#292524" strokeWidth="4" strokeLinecap="round" aria-hidden>
    <path d="M22 46 15 12 43 28Q60 20 77 28L105 12 98 46C115 105 5 105 22 46Z" />
    {surprised ? <><ellipse cx="42" cy="53" rx="7" ry="10" fill="#292524" /><ellipse cx="78" cy="53" rx="7" ry="10" fill="#292524" /><ellipse cx="60" cy="80" rx="10" ry="12" /></> : <><path d="M33 52q9-10 18 0M69 52q9-10 18 0M42 77q18 20 36 0" /></>}
    <path d="m55 63 5 5 5-5M31 70 9 65M31 78 7 82M89 70 111 65M89 78 113 82" />
  </svg>;
}
/** Original emotion meme, not an unlicensed clip from a series or a pretend GIF search result. */
export function VisualHook({ plan }: { plan: VisualPlan }) {
  const Icon = icons[plan.template];
  const [imageFailed, setImageFailed] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  function downloadCard() {
    try {
      const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1080;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("canvas");
      ctx.fillStyle = "#FAF8F5"; ctx.fillRect(0, 0, 1080, 1080);
      ctx.fillStyle = "#9E2A2B"; ctx.fillRect(0, 0, 1080, 24);
      ctx.font = "bold 36px Arial, sans-serif"; ctx.fillText("МАЛЕНЬКАЯ ДРАМА · ЖИВОЙ ИСПАНСКИЙ", 64, 110);
      ctx.save(); ctx.translate(320,300); ctx.scale(2.4,2.4); ctx.strokeStyle="#292524"; ctx.fillStyle="#fffaf4"; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(22,46); ctx.lineTo(15,12); ctx.lineTo(43,28); ctx.quadraticCurveTo(60,20,77,28); ctx.lineTo(105,12); ctx.lineTo(98,46); ctx.bezierCurveTo(115,105,5,105,22,46); ctx.fill(); ctx.stroke();
      for(const x of [42,78]){ctx.beginPath();ctx.ellipse(x,53,7,10,0,0,Math.PI*2);ctx.fillStyle="#292524";ctx.fill();}ctx.beginPath();ctx.ellipse(60,80,10,12,0,0,Math.PI*2);ctx.stroke();ctx.restore();
      ctx.font="bold 120px Arial, sans-serif";ctx.fillStyle="#9E2A2B";ctx.fillText(plan.template === "wallet" ? "€?!" : plan.template === "clock" ? "20 min" : plan.template === "memory" ? "♪" : "?!",650,450);
      ctx.textAlign = "left"; ctx.fillStyle = "#1c1917"; ctx.font = "bold 48px Arial, sans-serif";
      let line = "", y = 610;
      for (const word of plan.caption.split(/\s+/)) {
        const next = `${line} ${word}`.trim();
        if (ctx.measureText(next).width > 920 && line) { ctx.fillText(line, 80, y); y += 64; line = word; } else line = next;
      }
      ctx.fillText(line, 80, y);
      canvas.toBlob(blob => {
        if (!blob) { setDownloadError("Не удалось сохранить карточку."); return; }
        const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "wow-meme-card.png"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");
    } catch { setDownloadError("Сохранение недоступно в этом браузере."); }
  }
  return <figure className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
    {plan.mediaUrl && !imageFailed ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={plan.mediaUrl} alt={plan.emotion} referrerPolicy="no-referrer" className="max-h-80 w-full object-contain" onError={() => setImageFailed(true)} />
    </> : <div role="img" aria-label={plan.emotion} className="relative grid min-h-64 place-items-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-amber-50 p-6">
      <style>{`@keyframes wow-face-one {0%,40%,100%{opacity:1;transform:translateY(0)}50%,90%{opacity:0;transform:translateY(-8px)}}@keyframes wow-face-two {0%,40%,100%{opacity:0;transform:translateY(8px)}50%,90%{opacity:1;transform:translateY(0)}}.wow-face-one{animation:wow-face-one 4s infinite}.wow-face-two{animation:wow-face-two 4s infinite}@media(prefers-reduced-motion:reduce){.wow-face-one{animation:none}.wow-face-two{display:none}}`}</style>
      <div aria-hidden className="relative mb-5 flex h-28 items-center gap-6"><span className="wow-face-one"><Cat /></span><span className="wow-face-two absolute left-0"><Cat surprised /></span><Icon className="h-20 w-20 text-[#9E2A2B]" strokeWidth={1.5} /></div>
      <p className="max-w-sm text-center text-xl font-extrabold leading-tight">{plan.caption}</p>
      <span className="mt-3 text-xs text-stone-500">Оригинальная петля · 4 секунды</span>
    </div>}
    <figcaption className="space-y-3 p-4"><p className="text-sm leading-6 text-stone-600">{plan.concept}</p><details className="text-xs text-stone-500"><summary className="cursor-pointer font-bold">Идея для поиска GIF</summary><p className="mt-2">{plan.searchQuery}</p><p className="mt-1">Это поисковая идея, а не уже найденный клип. Свою HTTPS-ссылку можно добавить в редакторе.</p></details>
      <button type="button" className="min-h-11 rounded-xl border px-4 text-sm font-bold" onClick={downloadCard}>Скачать мем-карточку PNG</button><p className="text-xs text-stone-500">PNG — статичная карточка с подписью; анимация и добавленный GIF в неё не включаются.</p>{downloadError && <p role="alert" className="text-sm text-red-700">{downloadError}</p>}
    </figcaption>
  </figure>;
}
