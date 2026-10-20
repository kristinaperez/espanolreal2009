"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { TelegramLogin } from "@/components/auth/telegram-login";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArticleBody } from "./article-body";
import type { Article, ArticleInput } from "@/lib/blog";
const empty: ArticleInput = { slug: "", title: "", description: "", body: "", published: false };
const field = "mt-2 w-full rounded-xl border border-line bg-surface p-3 text-base font-normal";
export function BlogEditor() {
  const { user, status } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [draft, setDraft] = useState<ArticleInput>(empty);
  const [existing, setExisting] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const load = useCallback(async () => {
    try { const r = await fetch("/api/admin/blog", { cache: "no-store" }); const p = await r.json();
      setAllowed(r.ok); if (r.ok) { setArticles(p.articles); } else setMessage(p.error);
    } catch { setAllowed(false); setMessage("Не удалось загрузить статьи. Проверьте подключение."); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => { setAllowed(false); if (user) { void load(); } }, 0); return () => clearTimeout(timer); }, [load, user]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const choose = (article?: Article) => {
    if (dirty && !window.confirm("Есть несохранённые изменения. Перейти без сохранения?")) return;
    setDraft(article ?? empty); setExisting(!!article); setDirty(false); setMessage(""); setPreview(false);
  };
  const save = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/blog", { method: existing ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
      const result = await response.json(); if (!response.ok) throw Error(result.error ?? "Не удалось сохранить");
      setDraft(result.article); setExisting(true); setDirty(false); setMessage(result.article.published ? "Статья опубликована" : "Черновик сохранён"); await load();
    } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  };
  return <main className="mx-auto max-w-6xl px-4 py-10"><Link href="/blog" className="font-bold text-primary">← Открыть блог</Link><h1 className="mt-6 text-3xl font-black">Редактор статей</h1>
    {status === "loading" ? <p className="mt-6">Проверяем вход…</p> : !user ? <Card className="mt-6"><p className="mb-4">Войди через свой Telegram-аккаунт.</p><TelegramLogin /></Card> : !allowed ? <Card className="mt-6"><p role="status">{message || "Проверяем права…"}</p><p className="mt-3 text-sm text-muted">Твой Telegram ID: {user.telegramId}. Доступ выдаётся в настройках сервера.</p><Button className="mt-3" onClick={() => void load()}>Проверить снова</Button></Card> : <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
    <aside><Button disabled={busy} onClick={() => choose()}>+ Новая статья</Button><ul className="mt-5 space-y-3">{articles.map(a => <li key={a.slug}><button disabled={busy} className="w-full rounded-xl border border-line bg-surface p-3 text-left" onClick={() => choose(a)}><span className="block font-bold">{a.title}</span><small className="text-muted">{a.published ? "Опубликована" : "Черновик"}</small></button></li>)}</ul>{!articles.length && <p className="mt-4 text-sm text-muted">Создай первую статью.</p>}</aside>
    <Card><form onSubmit={e => { e.preventDefault(); void save(); }} className="grid gap-5"><fieldset disabled={busy} className="grid min-w-0 gap-5">
      <label className="font-bold">Заголовок<input required minLength={3} maxLength={160} className={field} value={draft.title} onChange={e => { setDraft({ ...draft, title: e.target.value }); setDirty(true); }} /></label>
      <label className="font-bold">Адрес статьи<input required disabled={existing} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} placeholder="kak-zakazat-kofe" className={field} value={draft.slug} onChange={e => { setDraft({ ...draft, slug: e.target.value }); setDirty(true); }} /><small className="mt-1 block font-normal text-muted">Латинские буквы, цифры и дефисы. После сохранения адрес сохраняется.</small></label>
      <label className="font-bold">Краткое описание<textarea required minLength={10} maxLength={300} rows={3} className={field} value={draft.description} onChange={e => { setDraft({ ...draft, description: e.target.value }); setDirty(true); }} /></label>
      <label className="font-bold">Текст статьи<textarea required minLength={20} maxLength={50000} rows={16} className={field} value={draft.body} onChange={e => { setDraft({ ...draft, body: e.target.value }); setDirty(true); }} /><small className="mt-1 block font-normal text-muted">Пустая строка разделяет абзацы. Начни строку с ## для подзаголовка или ### для малого подзаголовка.</small></label>
      <label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={draft.published} onChange={e => { setDraft({ ...draft, published: e.target.checked }); setDirty(true); }} />Опубликовать на сайте</label>
      <div className="flex flex-wrap gap-3"><Button type="submit">{busy ? "Сохраняем…" : draft.published ? "Сохранить и опубликовать" : "Сохранить черновик"}</Button><Button type="button" variant="secondary" onClick={() => setPreview(!preview)}>Предпросмотр</Button>{existing && draft.published && <Link target="_blank" href={`/blog/${draft.slug}`} className="inline-flex min-h-11 items-center font-bold text-primary">Открыть статью ↗</Link>}</div>
      </fieldset><p role="status" aria-live="polite">{message}</p></form>{preview && <section className="mt-8 border-t border-line pt-6"><h2 className="mb-5 text-3xl font-black">{draft.title}</h2><p className="mb-6 text-lg text-muted">{draft.description}</p><ArticleBody body={draft.body} /></section>}</Card>
    </div>}</main>;
}
