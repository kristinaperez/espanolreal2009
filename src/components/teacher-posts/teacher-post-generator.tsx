"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Copy, LoaderCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { TelegramLogin } from "@/components/auth/telegram-login";
import { HeaderNavUpdate } from "@/components/layout/header-nav-update";
import { emptyDraft, formatPost, parseDraft, parsePost, safePostUrl, type GeneratedPost, type LessonDraft } from "@/lib/teacher-posts/model";
import { socialPlatforms, shareUrl, type SocialPlatform } from "@/lib/teacher-posts/share";
import { PostPreview } from "./post-preview";
import { fieldClass, PostEditor } from "./post-editor";

const accent = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#9E2A2B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#8B1E21] disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold disabled:opacity-50";
const panel = "min-w-0 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7";
const storageKey = "espanolreal:teacher-posts:draft:v1";
export function TeacherPostGenerator() {
  const { user, status, botUsername } = useAuth();
  const [demo, setDemo] = useState(false);
  const [draft, setDraft] = useState<LessonDraft>(emptyDraft);
  const [generated, setGenerated] = useState<GeneratedPost | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<"generate" | "publish" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const [manualCopy, setManualCopy] = useState("");
  const revision = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef<HTMLElement>(null);
  const ownerKey = user ? String(user.telegramId) : "guest";
  const draftKey = `${storageKey}:${ownerKey}`;
  function toast(message: string) {
    setNotice(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setNotice(""), 4500);
  }
  useEffect(() => {
    let nextDraft = emptyDraft;
    let nextGenerated: GeneratedPost | null = null;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const data = JSON.parse(raw);
        // Empty/incomplete input is a valid local draft; the request validator remains strict.
        const candidate = parseDraft({ ...data.draft, sourceText: data.draft?.sourceText?.trim().length < 20 ? "temporary source text" : data.draft?.sourceText });
        if (candidate && typeof data.draft.sourceText === "string" && data.draft.sourceText.length <= 8000) nextDraft = { ...candidate, sourceText: data.draft.sourceText };
        // Only restore text; revalidate account-sensitive CTA on the next generation/publication.
        const post = parsePost(data.generated?.post);
        if (post) nextGenerated = { post, cta: null, mode: data.generated.mode === "ai" ? "ai" : "mock" };
      }
    } catch { /* Corrupt/unavailable storage must not block the editor. */ }
    revision.current++;
    activeRequest.current?.abort();
    const timer = setTimeout(() => {
      setBusy(null); setDraft(nextDraft); setGenerated(nextGenerated); setPublishedUrl(""); setLoadedKey(draftKey);
    }, 0);
    return () => clearTimeout(timer);
  }, [draftKey]);
  useEffect(() => {
    if (loadedKey !== draftKey || status === "loading") return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ draft, generated: generated ? { post: generated.post, mode: generated.mode } : null }));
        setSaved(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
      } catch { setSaved("недоступно"); }
    }, 600);
    return () => clearTimeout(timer);
  }, [draft, generated, loadedKey, draftKey, status]);
  useEffect(() => () => { activeRequest.current?.abort(); if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  function updateDraft(patch: Partial<LessonDraft>) {
    revision.current++;
    setDraft(current => ({ ...current, ...patch })); setPublishedUrl("");
    if (generated) setGenerated(current => current ? { ...current, cta: null } : null);
  }
  async function request(kind: "generate" | "publish") {
    const validated = parseDraft(draft);
    if (!validated) { setError("Напишите 20–8000 символов и проверьте ссылки: нужен полный адрес https://…"); return; }
    if (kind === "publish" && (!generated || !parsePost(generated.post))) { setError("Заполните все блоки поста и разные варианты ответа."); return; }
    setBusy(kind); setError(""); setManualCopy("");
    const version = revision.current;
    const controller = new AbortController(); activeRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 55_000);
    try {
      const response = await fetch(`/api/teacher/posts/${kind}`, { method: "POST", headers: { "content-type": "application/json" }, signal: controller.signal, body: JSON.stringify(kind === "generate" ? { ...validated, mode: demo && !user ? "mock" : "ai" } : { draft: validated, post: generated!.post, mode: generated!.mode }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Не удалось выполнить запрос.");
      if (version !== revision.current) { toast("Данные изменились. Повторите запрос для текущего черновика."); return; }
      if (kind === "generate") {
        const post = parsePost(payload.post);
        if (!post || !["mock", "ai"].includes(payload.mode)) throw new Error("Неполный ответ генератора. Попробуйте снова.");
        setGenerated({ post, mode: payload.mode, cta: payload.cta }); setEditing(false); setPublishedUrl("");
        if (window.innerWidth < 1024) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        setPublishedUrl(new URL(payload.path, window.location.origin).toString());
        setGenerated(current => current ? { ...current, cta: payload.cta } : null);
        toast("Пост опубликован. Ссылка готова.");
      }
    } catch (caught) {
      if (version === revision.current) setError(caught instanceof Error && caught.name !== "AbortError" ? caught.message : "Запрос прерван. Черновик сохранён — попробуйте снова.");
    } finally { clearTimeout(timeout); if (activeRequest.current === controller) { setBusy(null); activeRequest.current = null; } }
  }
  const exportText = generated ? formatPost(generated.post, generated.cta) : "";
  const shareLink = publishedUrl || generated?.cta?.url || "";
  async function copy(text: string, message: string) {
    try { await navigator.clipboard.writeText(text); toast(message); }
    catch { setManualCopy(text); toast("Выделите текст ниже и скопируйте вручную."); }
  }
  async function share(platform: SocialPlatform) {
    const url = shareUrl(platform, exportText, publishedUrl);
    if (url) { window.open(url, "_blank", "noopener,noreferrer"); return; }
    if (navigator.share) {
      try { await navigator.share({ title: generated!.post.title, text: exportText, ...(publishedUrl ? { url: publishedUrl } : {}) }); return; }
      catch (caught) { if (caught instanceof Error && caught.name === "AbortError") return; }
    }
    await copy(exportText, `Текст скопирован. Откройте ${platform} и вставьте в новую публикацию.`);
  }
  const unlocked = !!user || demo;
  return <div className="min-h-dvh bg-[#FAF8F5] text-stone-900"><HeaderNavUpdate />
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm"><Link href="/teacher" className="inline-flex min-h-11 items-center gap-2 font-semibold"><ArrowLeft size={16} />В кабинет</Link><span className="text-stone-500">{saved === "недоступно" ? "Автосохранение недоступно" : saved ? `Черновик на этом устройстве · ${saved}` : "Черновик на этом устройстве"}</span></div>
      <div className="mb-8 max-w-3xl"><p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#9E2A2B]">Студия преподавателя</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Из обычной заметки — в WOW-пост</h1><p className="mt-3 leading-7 text-stone-600">Зацепите внимание, объясните живой испанский и пригласите читателя попробовать. Ваш голос — в каждом посте.</p></div>
      {!unlocked && <section className={`${panel} mb-6 max-w-xl`}><h2 className="text-xl font-bold">Войдите, чтобы создать свой пост</h2><p className="mb-5 mt-2 text-sm leading-6 text-stone-600">Telegram подтвердит ваш аккаунт. После входа вы останетесь в генераторе.</p>{status === "loading" ? <p role="status">Проверяем вход…</p> : botUsername ? <TelegramLogin variant="compact" /> : <p className="text-sm text-stone-600">Вход временно недоступен. Можно попробовать тестовый генератор.</p>}<button type="button" className={`${secondary} mt-4`} onClick={() => setDemo(true)}>Попробовать тестовый режим</button><p className="mt-3 text-xs text-stone-500">Тестовый режим использует шаблон. Публикация доступна после входа.</p></section>}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className={panel}><h2 className="mb-6 text-lg font-extrabold">1. Ваш исходный материал</h2><form onSubmit={e => { e.preventDefault(); if (unlocked) void request("generate"); }} className="grid gap-5">
          <label className="text-sm font-bold">Тема / ключевая фраза <span className="font-normal text-stone-500">(необязательно)</span><input className={fieldClass} value={draft.topic} maxLength={160} placeholder="Me pones un café con leche" onChange={e => updateDraft({ topic: e.target.value })} /></label>
          <label className="text-sm font-bold">Исходный пост или заметка<textarea className={fieldClass} rows={9} minLength={20} maxLength={8000} required value={draft.sourceText} placeholder="Вставьте свой обычный пост: фразу, объяснение, наблюдение из жизни в Испании…" onChange={e => updateDraft({ sourceText: e.target.value })} /><span className="mt-1 block text-right text-xs font-normal text-stone-500">{draft.sourceText.length}/8000</span></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Тон<select className={fieldClass} value={draft.tone} onChange={e => updateDraft({ tone: e.target.value as LessonDraft["tone"] })}><option value="conversational">Живой разговорный</option><option value="humor">С юмором</option></select></label><label className="text-sm font-bold">Уровень / стиль<select className={fieldClass} value={draft.level} onChange={e => updateDraft({ level: e.target.value as LessonDraft["level"] })}><option>A1-A2</option><option>B1-B2</option><option value="slang">Сленг</option><option value="conversational">Разговорный</option></select></label></div>
          <details className="rounded-xl border border-stone-200 p-4" open><summary className="cursor-pointer text-sm font-bold">Куда пригласить читателя</summary><div className="mt-4 grid gap-4"><label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 accent-[#9E2A2B]" checked={draft.includeCta} onChange={e => updateDraft({ includeCta: e.target.checked })} />Добавить ссылку на мои уроки</label><label className="text-sm font-bold">Общая страница ваших уроков<input className={fieldClass} type="url" value={draft.teacherLessonsUrl} maxLength={2048} placeholder="https://ваш-сайт.com/уроки" onChange={e => updateDraft({ teacherLessonsUrl: e.target.value })} /></label><label className="text-sm font-bold">Конкретный урок <span className="font-normal">(необязательно)</span><input className={fieldClass} type="url" value={draft.lessonUrl} maxLength={2048} placeholder="https://…" onChange={e => updateDraft({ lessonUrl: e.target.value })} /></label>{draft.lessonUrl && <label className="text-sm font-bold">Название урока<input className={fieldClass} value={draft.lessonName} maxLength={120} onChange={e => updateDraft({ lessonName: e.target.value })} /></label>}<p className="text-xs leading-5 text-stone-500">Обычно — «Уроки преподавателя». Для конкретной ссылки — «Продолжить урок». Для аккаунта KristinaPerez9 сохраняется «Продолжить в EspanolReal».</p></div></details>
          <button type="submit" className={accent} disabled={!!busy || !unlocked}>{busy === "generate" ? <><LoaderCircle size={18} className="animate-spin" />Создаём интерактивный разбор…</> : <><Sparkles size={18} />Сгенерировать WOW-пост</>}</button>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        </form></section>
        <section ref={resultRef} className={`${panel} scroll-mt-44`} aria-busy={busy === "generate"}><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-extrabold">2. Ваш WOW-пост</h2>{generated && <button type="button" className={secondary} onClick={() => setEditing(!editing)}>{editing ? "Предпросмотр" : "Редактировать ✎"}</button>}</div>
          {!generated ? <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-stone-300 bg-[#FAF8F5] p-7 text-center"><div><Sparkles className="mx-auto mb-4 text-[#9E2A2B]" size={32} /><p className="font-semibold">Здесь начнётся ваш WOW-пост</p><p className="mt-3 text-sm leading-6 text-stone-500">Нажмите «Сгенерировать», чтобы получить пост с примером, разбором и мини-квизом.</p></div></div> : <>
            <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">{generated.mode === "mock" ? "Тестовый шаблон: исходный разбор сохранён без AI-переписывания. Настоящая AI-генерация подключается на сервере." : "Создано с AI. Проверьте точность примеров и разбора перед публикацией."}</p>
            {editing ? <PostEditor post={generated.post} onChange={post => { revision.current++; setGenerated({ ...generated, post }); setPublishedUrl(""); }} /> : <PostPreview key={JSON.stringify(generated.post.interactiveQuestion)} post={generated.post} cta={generated.cta} />}
            {!generated.cta && <p className="mt-3 text-xs text-stone-500">Ссылка не добавлена. После изменения ссылок повторите генерацию или опубликуйте пост, чтобы обновить призыв.</p>}
            <div className="mt-5 grid gap-3"><button type="button" className={accent} disabled={!!busy || !user || !parsePost(generated.post) || !!publishedUrl} onClick={() => void request("publish")}>{busy === "publish" ? <><LoaderCircle size={18} className="animate-spin" />Публикуем…</> : publishedUrl ? "Пост опубликован" : "Опубликовать интерактивный пост"}</button>{!user && <p className="text-xs text-stone-500">Для публикации нужен вход через Telegram. Экспорт текста доступен сейчас.</p>}{publishedUrl && <Link href={publishedUrl} className="break-all text-sm font-bold text-[#9E2A2B]">Открыть опубликованный пост →</Link>}
              <div className="grid gap-2 sm:grid-cols-2"><button type="button" className={secondary} disabled={!parsePost(generated.post)} onClick={() => void copy(exportText, "Текст поста скопирован")}><Copy size={16} />Скопировать текст для поста</button><button type="button" className={secondary} disabled={!shareLink || !safePostUrl(shareLink)} onClick={() => void copy(shareLink, "Ссылка скопирована")}>Скопировать ссылку</button></div>
            </div>
            <h3 className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-stone-500">Поделиться в соцсетях</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{socialPlatforms.map(platform => <button type="button" key={platform} disabled={!parsePost(generated.post)} className={secondary} onClick={() => void share(platform)}>{platform}</button>)}</div><p className="mt-3 text-xs leading-5 text-stone-500">Telegram и WhatsApp откроют окно отправки. Остальные кнопки вызовут меню «Поделиться», где можно выбрать приложение, или скопируют текст для вставки. Отправку подтверждаете вы.</p>
          </>}
          {manualCopy && <label className="mt-5 block text-sm font-bold">Текст для ручного копирования<textarea readOnly value={manualCopy} onFocus={e => e.target.select()} rows={8} className={fieldClass} /></label>}
        </section>
      </div>
    </main>{notice && <div role="status" className="fixed inset-x-4 bottom-5 z-50 mx-auto max-w-lg rounded-2xl bg-stone-900 p-4 text-sm text-white shadow-lg">{notice}</div>}
  </div>;
}
