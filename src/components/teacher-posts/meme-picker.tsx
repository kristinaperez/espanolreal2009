"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { safePostUrl, type VisualHook as VisualPlan } from "@/lib/teacher-posts/model";
import { MemeArtwork } from "./visual-hook";
import { fieldClass } from "./fields";

const variants = ["drama", "expectation", "deadpan"] as const;
const labels = { drama: "Маленькая драма", expectation: "Ожидание / реальность", deadpan: "Без слов" };
const captions = {
  wallet: ["Увидела цену. Проверила баланс. Закрыла вкладку.", "План: концерт и тапас. Реальность: 1 € на карте.", "Баланс посмотрел на меня. Я посмотрела на баланс."],
  clock: ["До поезда 20 минут. Лента решила, что у нас вечность.", "План: использовать время с пользой. Реальность: ещё один ролик.", "Свободная минутка сама себя с пользой не использует."],
  memory: ["Музыку выключили. Вместе с ней исчезло моё знание песни.", "План: знаю все слова. Реальность: уверенно пою только припев.", "Когда знаешь стих настолько, что уже репетируешь поклон."],
  reaction: ["Когда фраза знакомая, а ситуация внезапно стала личной.", "План: сказать как в учебнике. Реальность: живой разговор.", "Поняла фразу. Узнала себя. Молча кивнула."],
};
export function memeCaption(plan: VisualPlan, variant: typeof variants[number]) {
  return variant === "drama" ? plan.caption : captions[plan.template][variants.indexOf(variant)];
}
/** Raster-only, resized and re-encoded upload; stored with the existing post JSON. */
export async function normalizeMemeUpload(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error("Выберите JPG, PNG или WebP размером до 8 МБ.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Не удалось прочитать картинку.")); image.src = url; });
    if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 20_000_000) throw new Error("Картинка слишком большая: максимум 20 мегапикселей.");
    const canvas = document.createElement("canvas");
    const ratio = Math.min(1, 960 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Загрузка недоступна в этом браузере.");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55, 0.4, 0.25]) { const data = canvas.toDataURL("image/jpeg", quality); if (data.length <= 160_000) return data; }
    throw new Error("Не удалось уменьшить картинку. Выберите изображение попроще или вставьте HTTPS-ссылку.");
  } finally { URL.revokeObjectURL(url); }
}
export function MemePicker({ plan, onChange, disabled = false }: { plan: VisualPlan; onChange: (plan: VisualPlan) => void; disabled?: boolean }) {
  const [url, setUrl] = useState(plan.mediaUrl);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const alive = useRef(true);
  const current = useRef({ plan, disabled });
  useLayoutEffect(() => { current.current = { plan, disabled }; }, [plan, disabled]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function upload(file: File) {
    const initial = plan; setError(""); setLoading(true);
    try {
      const uploadedImage = await normalizeMemeUpload(file);
      if (!alive.current) return;
      if (current.current.plan !== initial || current.current.disabled) { setError("Пост изменился. Выберите картинку ещё раз."); return; }
      onChange({ ...plan, enabled: true, uploadedImage, mediaUrl: "" }); setUrl("");
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : "Не удалось загрузить картинку."); }
    finally { if (alive.current) setLoading(false); }
  }
  const locked = disabled || loading;
  return <section aria-label="Выбрать мем" className="mb-5 min-w-0 space-y-4 rounded-2xl border border-stone-200 bg-[#FAF8F5] p-4">
    <h3 className="font-extrabold">Выбрать мем</h3><p className="text-sm text-stone-600">Три оригинальных варианта по ситуации поста. Можно заменить изображение или оставить только текст.</p>
    <div className="grid gap-3 sm:grid-cols-3">{variants.map(variant => {
      const active = plan.enabled !== false && !plan.mediaUrl && !plan.uploadedImage && (plan.variant ?? "drama") === variant;
      return <button key={variant} type="button" disabled={locked} aria-pressed={active} aria-label={labels[variant]} onClick={() => { setError(""); onChange({ ...plan, enabled: true, variant, mediaUrl: "", uploadedImage: "", caption: variant === "drama" ? captions[plan.template][0] : memeCaption(plan, variant) }); setUrl(""); }} className={`min-w-0 overflow-hidden rounded-xl border text-left disabled:opacity-50 ${active ? "border-[#9E2A2B] ring-2 ring-[#9E2A2B]/20" : "border-stone-200"}`}>
        <div className="pointer-events-none" aria-hidden><MemeArtwork plan={{ ...plan, variant, caption: variant === "drama" ? captions[plan.template][0] : memeCaption(plan, variant) }} compact /></div><span className="block p-3 text-sm font-bold">{labels[variant]}{active ? " · Выбран" : ""}</span>
      </button>;
    })}</div>
    <button type="button" disabled={locked} aria-pressed={plan.enabled === false} className={`min-h-11 rounded-xl border px-4 text-sm font-bold ${plan.enabled === false ? "border-[#9E2A2B] bg-rose-50" : "bg-white"}`} onClick={() => { setError(""); onChange({ ...plan, enabled: false }); }}>Без мема</button>
    {plan.enabled === false && (plan.mediaUrl || plan.uploadedImage) && <button type="button" disabled={locked} className="ml-2 min-h-11 rounded-xl border bg-white px-4 text-sm font-bold" onClick={() => onChange({ ...plan, enabled: true })}>Вернуть свою картинку</button>}
    <div className="grid min-w-0 gap-3"><div className="text-sm"><span className="block font-bold">Загрузить свою картинку</span><div className="mt-2 flex flex-wrap items-center gap-3"><label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-stone-200 bg-white px-3 font-bold focus-within:ring-2 focus-within:ring-[#9E2A2B]"><span>Выбрать файл</span><input aria-label="Загрузить свою картинку" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={locked} onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void upload(file); }} /></label><span role="status">{loading ? "Подготавливаем картинку…" : plan.uploadedImage ? "Выбрана своя картинка" : "Файл не выбран"}</span></div></div>
      <p className="text-xs text-stone-500">JPG, PNG, WebP до 8 МБ. Картинка будет уменьшена и сохранена с постом. Для анимированной GIF используйте ссылку.</p>
      <label className="text-sm font-bold">Заменить по ссылке на GIF / изображение<input aria-label="Ссылка на GIF" type="url" value={url} maxLength={2048} className={fieldClass} placeholder="https://…" disabled={locked} onChange={e => setUrl(e.target.value)} /></label>
      <button type="button" disabled={locked || !url.trim()} className="min-h-11 rounded-xl border bg-white px-4 text-sm font-bold disabled:opacity-50" onClick={() => { const safe = safePostUrl(url); if (!safe) { setError("Нужен полный публичный адрес https://…"); return; } setError(""); onChange({ ...plan, enabled: true, mediaUrl: safe, uploadedImage: "" }); }}>Использовать ссылку</button>
    </div>
    {loading && <p role="status" className="text-sm">Подготавливаем картинку…</p>}{plan.enabled !== false && plan.mediaUrl && <p role="status" className="text-sm font-bold text-[#9E2A2B]">Выбрана своя картинка{plan.mediaUrl ? " / GIF" : ""}</p>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>;
}
