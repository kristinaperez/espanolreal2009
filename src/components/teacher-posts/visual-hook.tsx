"use client";
import { useState } from "react";
import { Clock3, MessageCircle, Mic, Wallet } from "lucide-react";
import type { VisualHook as VisualPlan } from "@/lib/teacher-posts/model";
const icons = { wallet: Wallet, clock: Clock3, memory: Mic, reaction: MessageCircle };
function Cat({ surprised = false, small = false }: { surprised?: boolean; small?: boolean }) {
  return <svg viewBox="0 0 120 120" className={small ? "h-12 w-12 shrink-0" : "h-28 w-28"} fill="#fffaf4" stroke="#292524" strokeWidth="4" strokeLinecap="round" aria-hidden>
    <path d="M22 46 15 12 43 28Q60 20 77 28L105 12 98 46C115 105 5 105 22 46Z" />
    {surprised ? <><ellipse cx="42" cy="53" rx="7" ry="10" fill="#292524" /><ellipse cx="78" cy="53" rx="7" ry="10" fill="#292524" /><ellipse cx="60" cy="80" rx="10" ry="12" /></> : <><path d="M33 52q9-10 18 0M69 52q9-10 18 0M42 77q18 20 36 0" /></>}
    <path d="m55 63 5 5 5-5M31 70 9 65M31 78 7 82M89 70 111 65M89 78 113 82" />
  </svg>;
}
/** Original emotion meme, not an unlicensed clip from a series or a pretend GIF search result. */
export function VisualHook({ plan }: { plan: VisualPlan }) {
  const media = plan.uploadedImage || plan.mediaUrl;
  const [imageFailed, setImageFailed] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  function downloadCard() {
    if (plan.uploadedImage) { const a = document.createElement("a"); a.href = plan.uploadedImage; a.download = "wow-meme-upload.jpg"; a.click(); return; }
    try {
      const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1080;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("canvas");
      ctx.fillStyle = plan.variant === "expectation" ? "#fff1f2" : plan.variant === "deadpan" ? "#f5f5f4" : "#FAF8F5"; ctx.fillRect(0, 0, 1080, 1080);
      ctx.fillStyle = "#9E2A2B"; ctx.fillRect(0, 0, 1080, 24);
      ctx.font = "bold 28px Arial, sans-serif"; ctx.fillText(`${plan.variant === "expectation" ? "ОЖИДАНИЕ / РЕАЛЬНОСТЬ" : plan.variant === "deadpan" ? "БЕЗ СЛОВ" : "МАЛЕНЬКАЯ ДРАМА"} · ЖИВОЙ ИСПАНСКИЙ`, 64, 110);
      function drawCat(x: number, surprised: boolean) {
        ctx!.save(); ctx!.translate(x, 270); ctx!.scale(2.4,2.4); ctx!.strokeStyle="#292524"; ctx!.fillStyle="#fffaf4"; ctx!.lineWidth=4;
        ctx!.beginPath(); ctx!.moveTo(22,46); ctx!.lineTo(15,12); ctx!.lineTo(43,28); ctx!.quadraticCurveTo(60,20,77,28); ctx!.lineTo(105,12); ctx!.lineTo(98,46); ctx!.bezierCurveTo(115,105,5,105,22,46); ctx!.fill(); ctx!.stroke();
        if (surprised) { for(const x of [42,78]){ctx!.beginPath();ctx!.ellipse(x,53,7,10,0,0,Math.PI*2);ctx!.fillStyle="#292524";ctx!.fill();}ctx!.beginPath();ctx!.ellipse(60,80,10,12,0,0,Math.PI*2);ctx!.stroke(); }
        else { ctx!.beginPath(); ctx!.moveTo(33,52); ctx!.quadraticCurveTo(42,42,51,52); ctx!.moveTo(69,52); ctx!.quadraticCurveTo(78,42,87,52); ctx!.moveTo(42,77); ctx!.quadraticCurveTo(60,97,78,77); ctx!.stroke(); }
        ctx!.restore();
      }
      ctx.font="bold 36px Arial, sans-serif";ctx.fillStyle="#9E2A2B";
      if (plan.variant === "expectation") { drawCat(130,false); drawCat(610,true); ctx.fillText("ПЛАН",180,230); ctx.fillText("РЕАЛЬНОСТЬ",620,230); }
      else { drawCat(260,plan.variant !== "deadpan"); ctx.font="bold 100px Arial, sans-serif";ctx.fillStyle="#9E2A2B";ctx.fillText(plan.variant === "deadpan" ? "…" : plan.template === "wallet" ? "€?!" : plan.template === "clock" ? "20 min" : plan.template === "memory" ? "♪" : "?!",620,420); }
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
    {media && !imageFailed ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media} alt={plan.emotion} referrerPolicy="no-referrer" className="max-h-80 w-full object-contain" onError={() => setImageFailed(true)} />
    </> : <MemeArtwork plan={plan} />}
    <figcaption className="space-y-3 p-4">{imageFailed && <p role="alert" className="text-sm text-red-700">Картинка не загрузилась. Показан запасной шаблон; замените ссылку или загрузите файл.</p>}<p className="text-sm leading-6 text-stone-600">{plan.concept}</p><details className="text-xs text-stone-500"><summary className="cursor-pointer font-bold">Идея для поиска GIF</summary><p className="mt-2">{plan.searchQuery}</p><p className="mt-1">Это поисковая идея, а не уже найденный клип. Свою HTTPS-ссылку можно добавить в блоке выбора мема.</p></details>
      {plan.mediaUrl ? <a className="inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-bold" href={plan.mediaUrl} target="_blank" rel="noopener noreferrer">Открыть своё изображение / GIF</a> : <><button type="button" className="min-h-11 rounded-xl border px-4 text-sm font-bold" onClick={downloadCard}>{plan.uploadedImage ? "Скачать свою картинку" : "Скачать мем-карточку PNG"}</button><p className="text-xs text-stone-500">{plan.uploadedImage ? "Сохраняется загруженная картинка в формате JPG." : "PNG — статичная карточка с подписью; анимация в неё не включается."}</p></>}{downloadError && <p role="alert" className="text-sm text-red-700">{downloadError}</p>}
    </figcaption>
  </figure>;
}

export function MemeArtwork({ plan, compact = false }: { plan: VisualPlan; compact?: boolean }) {
  const Icon = icons[plan.template]; const variant = plan.variant ?? "drama";
  return <div role={compact ? undefined : "img"} aria-label={compact ? undefined : plan.emotion} className={`relative grid place-items-center overflow-hidden p-4 ${compact ? "min-h-52" : "min-h-64"} ${variant === "expectation" ? "bg-rose-50" : variant === "deadpan" ? "bg-stone-100" : "bg-gradient-to-br from-rose-50 via-white to-amber-50"}`}>
    {!compact && <style>{`@keyframes wow-face-one {0%,40%,100%{opacity:1;transform:translateY(0)}50%,90%{opacity:0;transform:translateY(-8px)}}@keyframes wow-face-two {0%,40%,100%{opacity:0;transform:translateY(8px)}50%,90%{opacity:1;transform:translateY(0)}}.wow-face-one{animation:wow-face-one 4s infinite}.wow-face-two{animation:wow-face-two 4s infinite}@media(prefers-reduced-motion:reduce){.wow-face-one{animation:none}.wow-face-two{display:none}}`}</style>}
    <div aria-hidden className={`relative mb-3 flex items-center justify-center gap-2 ${compact ? "h-20" : "h-28"}`}>
      {variant === "expectation" ? <><div className="text-center"><span className="text-xs font-bold">ПЛАН</span><Cat small={compact} /></div><span className="font-bold text-[#9E2A2B]">→</span><div className="text-center"><span className="text-xs font-bold">РЕАЛЬНОСТЬ</span><Cat surprised small={compact} /></div></> : variant === "deadpan" ? <><Cat small={compact} /><span className="text-4xl font-extrabold text-[#9E2A2B]">…</span></> : <><span className={compact ? "" : "wow-face-one"}><Cat small={compact} /></span>{!compact && <span className="wow-face-two absolute left-0"><Cat surprised small={compact} /></span>}<Icon className={`${compact ? "h-8 w-8" : "h-16 w-16"} shrink-0 text-[#9E2A2B]`} strokeWidth={1.5} /></>}
    </div><p className={`max-w-sm text-center font-extrabold leading-tight ${compact ? "text-sm" : "text-xl"}`}>{plan.caption}</p>{!compact && <span className="mt-3 text-xs text-stone-500">{variant === "drama" ? "Оригинальная петля · 4 секунды" : "Оригинальный мем-шаблон"}</span>}
  </div>;
}
