"use client";

import { useEffect, useRef, useState } from "react";
import { AudioButton } from "./audio-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { recordingToWav } from "@/lib/audio/wav";
import type { PronunciationResult } from "@/server/pronunciation/azure";
import { getWebApp } from "@/lib/telegram/webapp";
import { useAuth } from "@/components/providers/auth-provider";

type CaptureState = "idle" | "requesting" | "recording" | "ready";
const MAX_SECONDS = 15;

function captureError(error: unknown) {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "لم يُسمح باستخدام الميكروفون. يمكنك السماح به من إعدادات المتصفح أو متابعة الدرس دون تسجيل.";
  if (name === "NotFoundError") return "لم يتم العثور على ميكروفون. يمكنك متابعة الدرس بالقراءة والاستماع.";
  if (name === "NotReadableError") return "الميكروفون غير متاح الآن. أغلق التطبيقات التي تستخدمه ثم حاول مجددًا.";
  return "تعذّر التسجيل. حاول مجددًا أو تابع الدرس دون تسجيل.";
}

/** Audio stays local until explicit consent and assessment submission. */
export function PronunciationPractice({ phrases, lessonId }: { phrases: string[]; lessonId: string }) {
  const { refresh } = useAuth();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [state, setState] = useState<CaptureState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [consent, setConsent] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const recordingBlob = useRef<Blob | null>(null);
  const evaluation = useRef<AbortController | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const objectUrl = useRef<string | null>(null);
  const mounted = useRef(false);
  const pending = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadline = useRef<ReturnType<typeof setTimeout> | null>(null);

  function releaseCapture() {
    if (timer.current) clearInterval(timer.current);
    if (deadline.current) clearTimeout(deadline.current);
    timer.current = null;
    deadline.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  }

  useEffect(() => {
    mounted.current = true;
    const config = new AbortController();
    if (typeof fetch !== "undefined") void fetch("/api/pronunciation", { signal: config.signal }).then(response => response.json()).then(value => { if (mounted.current) setEnabled(value.enabled === true); }).catch(() => {});
    return () => {
      mounted.current = false;
      config.abort();
      evaluation.current?.abort();
      if (timer.current) clearInterval(timer.current);
      if (deadline.current) clearTimeout(deadline.current);
      const active = recorder.current;
      if (active) {
        active.ondataavailable = null;
        active.onstop = null;
        active.onerror = null;
        if (active.state !== "inactive") active.stop();
      }
      stream.current?.getTracks().forEach(track => track.stop());
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);

  function discard() {
    evaluation.current?.abort();
    recordingBlob.current = null;
    setEvaluating(false);
    setConsent(false);
    setResult(null);
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
    setAudioUrl(null);
    setSeconds(0);
    setState("idle");
    setError("");
  }

  function stop() {
    const active = recorder.current;
    if (active?.state === "recording") {
      active.stop();
      releaseCapture();
    }
  }

  async function start() {
    if (pending.current || recorder.current?.state === "recording") return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("التسجيل غير مدعوم هنا. جرّب فتح الموقع عبر HTTPS في Safari أو Chrome، أو تابع دون تسجيل.");
      return;
    }
    discard();
    pending.current = true;
    setState("requesting");
    try {
      const captured = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (!mounted.current) {
        captured.getTracks().forEach(track => track.stop());
        return;
      }
      stream.current = captured;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(type => MediaRecorder.isTypeSupported(type));
      const active = new MediaRecorder(captured, mimeType ? { mimeType } : undefined);
      recorder.current = active;
      const chunks: Blob[] = [];
      let failed = false;
      active.ondataavailable = event => { if (event.data.size > 0) chunks.push(event.data); };
      active.onerror = () => {
        if (recorder.current !== active) return;
        failed = true;
        releaseCapture();
        if (active.state !== "inactive") active.stop();
        if (mounted.current) { setState("idle"); setError(captureError(null)); }
      };
      active.onstop = () => {
        if (recorder.current !== active) return;
        releaseCapture();
        recorder.current = null;
        if (!mounted.current || failed) return;
        const blob = new Blob(chunks, { type: active.mimeType || chunks[0]?.type || "audio/webm" });
        if (!blob.size) { setState("idle"); setError("لم يتم تسجيل صوت. حاول مجددًا."); return; }
        recordingBlob.current = blob;
        const url = URL.createObjectURL(blob);
        objectUrl.current = url;
        setAudioUrl(url);
        setState("ready");
      };
      active.start();
      setState("recording");
      const started = Date.now();
      timer.current = setInterval(() => setSeconds(Math.min(MAX_SECONDS, Math.floor((Date.now() - started) / 1000))), 250);
      deadline.current = setTimeout(stop, MAX_SECONDS * 1000);
    } catch (problem) {
      releaseCapture();
      if (mounted.current) { setState("idle"); setError(captureError(problem)); }
    } finally {
      pending.current = false;
    }
  }

  async function assess() {
    if (!consent || !recordingBlob.current || evaluating) return;
    const controller = new AbortController();
    evaluation.current = controller;
    setEvaluating(true); setError(""); setResult(null);
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const wav = await recordingToWav(recordingBlob.current);
      if (controller.signal.aborted || !mounted.current) return;
      const submit = () => fetch(`/api/pronunciation?lesson=${encodeURIComponent(lessonId)}&phrase=${phraseIndex}`, { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "audio/wav" }, body: wav, signal: controller.signal });
      let response = await submit();
      // A Mini App can retain signed initData after its browser cookie expires.
      // Reauthenticate through the existing signature-validated endpoint once.
      const initData = getWebApp()?.initData;
      if (response.status === 401 && initData && !controller.signal.aborted) {
        const login = await fetch("/api/telegram/auth/init", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initData }), signal: controller.signal });
        if (login.ok) {
          await refresh();
          if (controller.signal.aborted || !mounted.current) return;
          response = await submit();
        }
      }
      if (controller.signal.aborted || !mounted.current) return;
      if (!response.headers.get("content-type")?.includes("application/json")) {
        setError(`تعذّر الوصول إلى خدمة التقييم (HTTP ${response.status}). أعد تحميل الصفحة وحاول مجددًا؛ لم تُحسب درجة.`);
        return;
      }
      const payload = await response.json();
      if (!mounted.current || controller.signal.aborted) return;
      if (!response.ok || payload.ok !== true) {
        const messages: Record<string, string> = {
          login_required: "سجّل الدخول عبر Telegram في صفحة الحساب لتقييم النطق، ثم عد إلى الدرس. يبقى التسجيل متاحًا دون تسجيل دخول.",
          unconfigured: "خدمة تقييم النطق غير مفعّلة حاليًا. يمكنك متابعة الدرس.",
          rate_limited: "وصلت إلى الحد المؤقت للتقييم. حاول لاحقًا.",
          no_speech: "الصوت منخفض جدًا أو لم يتم تسجيل كلام. سجّل محاولة جديدة في مكان هادئ.",
          no_assessment: "لم نحصل على تقييم موثوق. حاول نطق العبارة كاملة مجددًا.",
          format: "تعذّر تجهيز الصوت للتقييم. حاول في Safari أو Chrome.",
        };
        setError(messages[payload.code] ?? "التقييم غير متاح الآن. حاول لاحقًا؛ لم تُحسب درجة.");
        return;
      }
      if (typeof payload.score !== "number" || !Number.isFinite(payload.score) || payload.score < 0 || payload.score > 10 || !Array.isArray(payload.words)) throw new Error("Invalid assessment");
      setResult(payload as PronunciationResult);
    } catch { if (mounted.current) setError("تعذّر تقييم التسجيل. حاول لاحقًا أو استخدم Safari أو Chrome؛ لم تُحسب درجة."); }
    finally { clearTimeout(timeout); if (mounted.current) setEvaluating(false); }
  }

  const busy = state === "recording" || state === "requesting" || evaluating;
  return <div className="space-y-4 rounded-2xl border border-line bg-background-soft p-4 sm:p-6">
    <h3 className="text-xl font-bold">تدرّب على النطق بصوتك</h3>
    <p className="text-sm leading-7">استمع، سجّل صوتك ثم استمع إلى تسجيلك. يبقى التسجيل مؤقتًا في هذا المتصفح حتى تختار إرساله للتقييم. مدة التسجيل القصوى 15 ثانية.</p>
    <label className="block space-y-2"><span>اختر كلمة أو عبارة</span>
      <select aria-label="اختر كلمة أو عبارة" dir="ltr" lang="es" disabled={busy} value={phraseIndex} onChange={event => { discard(); setPhraseIndex(Number(event.target.value)); }} className="w-full min-w-0 rounded-xl border border-line bg-surface p-3">
        {phrases.map((phrase, index) => <option value={index} key={`${index}-${phrase}`}>{phrase}</option>)}
      </select>
    </label>
    <p lang="es" dir="ltr" className="break-words text-xl font-bold">{phrases[phraseIndex]}</p>
    {!busy && <AudioButton spanish={phrases[phraseIndex]} lessonId={lessonId} />}
    <div className="flex flex-wrap gap-3">
      {state === "recording" ? <Button onClick={stop}>أوقف التسجيل</Button> : <Button disabled={state === "requesting" || evaluating} onClick={start}>{state === "requesting" ? "جارٍ طلب الميكروفون…" : audioUrl ? "سجّل محاولة جديدة" : "سجّل صوتك"}</Button>}
      {audioUrl && <Button variant="secondary" disabled={evaluating} onClick={discard}>احذف التسجيل</Button>}
    </div>
    {state === "recording" && <p role="status">جارٍ التسجيل… <bdi dir="ltr">{seconds} / {MAX_SECONDS}</bdi></p>}
    {error && <p role="alert" className="text-sm leading-7">{error}</p>}
    {audioUrl && <div className="space-y-2"><p>استمع إلى تسجيلك</p><audio aria-label="تسجيلك" controls src={audioUrl} className="w-full" /></div>}
    <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <p className="font-bold">{enabled ? "تقييم النطق بالذكاء الاصطناعي" : "تقييم النطق بالذكاء الاصطناعي: غير متاح بعد"}</p>
      {enabled && audioUrl && <>
        <label className="flex items-start gap-2 text-sm leading-7"><input type="checkbox" checked={consent} disabled={evaluating} onChange={event => setConsent(event.target.checked)} className="mt-2" /><span>أوافق على إرسال هذا التسجيل إلى Microsoft Azure Speech لتقييم نطقي. لا يحفظ EspañolReal الملف في قاعدة بياناته. <a className="underline" href="https://learn.microsoft.com/azure/ai-services/speech-service/speech-to-text-data-privacy-security" target="_blank" rel="noopener noreferrer">معلومات معالجة الصوت</a></span></label>
        <Button disabled={!consent || evaluating} onClick={assess}>{evaluating ? "جارٍ التقييم…" : "قيّم نطقي"}</Button>
        <Link href="/ar/account" className="block text-sm underline">الحساب / تسجيل الدخول عبر Telegram</Link>
      </>}
      {result ? <>
        <p role="status" className="text-2xl font-bold">دقة النطق: <bdi dir="ltr">{result.score.toFixed(1)} / 10</bdi></p>
        <meter aria-label="دقة النطق" min={0} max={10} value={result.score} className="h-5 w-full" />
        <ul dir="ltr" lang="es" className="flex flex-wrap gap-2">{result.words.map((word, index) => <li key={index} className={`rounded-lg border px-3 py-2 ${word.error === "Omission" || word.error === "Insertion" || (word.accuracy !== null && word.accuracy < 60) ? "border-amber-600 bg-amber-50 text-amber-950" : "border-line"}`}><b>{word.word}</b>{word.accuracy !== null && <span> · {(word.accuracy / 10).toFixed(1)}</span>}{word.error === "Omission" && <span lang="ar"> · كلمة غير منطوقة</span>}{word.error === "Insertion" && <span lang="ar"> · كلمة إضافية</span>}</li>)}</ul>
        <p className="text-sm leading-7">الدرجة تقدير آلي مقارنة بنموذج الإسبانية في إسبانيا، وليست اختبارًا رسميًا. أعد الكلمات المظلّلة ثم جرّب مجددًا.</p>
      </> : <p className="text-sm leading-7">لا توجد درجة لهذه المحاولة الآن. يمكنك متابعة الدرس دون تقييم.</p>}
    </div>
  </div>;
}
