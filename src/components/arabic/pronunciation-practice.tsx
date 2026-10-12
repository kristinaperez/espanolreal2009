"use client";

import { useEffect, useRef, useState } from "react";
import { AudioButton } from "./audio-button";
import { Button } from "@/components/ui/button";

type CaptureState = "idle" | "requesting" | "recording" | "ready";
const MAX_SECONDS = 15;

function captureError(error: unknown) {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "لم يُسمح باستخدام الميكروفون. يمكنك السماح به من إعدادات المتصفح أو متابعة الدرس دون تسجيل.";
  if (name === "NotFoundError") return "لم يتم العثور على ميكروفون. يمكنك متابعة الدرس بالقراءة والاستماع.";
  if (name === "NotReadableError") return "الميكروفون غير متاح الآن. أغلق التطبيقات التي تستخدمه ثم حاول مجددًا.";
  return "تعذّر التسجيل. حاول مجددًا أو تابع الدرس دون تسجيل.";
}

/** Local recording prototype. No upload, recognition or synthetic assessment score. */
export function PronunciationPractice({ phrases, lessonId }: { phrases: string[]; lessonId: string }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [state, setState] = useState<CaptureState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
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
    return () => {
      mounted.current = false;
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
        failed = true;
        releaseCapture();
        if (active.state !== "inactive") active.stop();
        if (mounted.current) { setState("idle"); setError(captureError(null)); }
      };
      active.onstop = () => {
        releaseCapture();
        recorder.current = null;
        if (!mounted.current || failed) return;
        const blob = new Blob(chunks, { type: active.mimeType || chunks[0]?.type || "audio/webm" });
        if (!blob.size) { setState("idle"); setError("لم يتم تسجيل صوت. حاول مجددًا."); return; }
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

  const busy = state === "recording" || state === "requesting";
  return <div className="space-y-4 rounded-2xl border border-line bg-background-soft p-4 sm:p-6">
    <h3 className="text-xl font-bold">تدرّب على النطق بصوتك</h3>
    <p className="text-sm leading-7">استمع، سجّل صوتك ثم استمع إلى تسجيلك. يبقى التسجيل مؤقتًا في هذا المتصفح ولا يُرسل إلى الخادم. مدة التسجيل القصوى 15 ثانية.</p>
    <label className="block space-y-2"><span>اختر كلمة أو عبارة</span>
      <select aria-label="اختر كلمة أو عبارة" dir="ltr" lang="es" disabled={busy} value={phraseIndex} onChange={event => { discard(); setPhraseIndex(Number(event.target.value)); }} className="w-full min-w-0 rounded-xl border border-line bg-surface p-3">
        {phrases.map((phrase, index) => <option value={index} key={`${index}-${phrase}`}>{phrase}</option>)}
      </select>
    </label>
    <p lang="es" dir="ltr" className="break-words text-xl font-bold">{phrases[phraseIndex]}</p>
    {!busy && <AudioButton spanish={phrases[phraseIndex]} lessonId={lessonId} />}
    <div className="flex flex-wrap gap-3">
      {state === "recording" ? <Button onClick={stop}>أوقف التسجيل</Button> : <Button disabled={state === "requesting"} onClick={start}>{state === "requesting" ? "جارٍ طلب الميكروفون…" : audioUrl ? "سجّل محاولة جديدة" : "سجّل صوتك"}</Button>}
      {audioUrl && <Button variant="secondary" onClick={discard}>احذف التسجيل</Button>}
    </div>
    {state === "recording" && <p role="status">جارٍ التسجيل… <bdi dir="ltr">{seconds} / {MAX_SECONDS}</bdi></p>}
    {error && <p role="alert" className="text-sm leading-7">{error}</p>}
    {audioUrl && <div className="space-y-2"><p>استمع إلى تسجيلك</p><audio aria-label="تسجيلك" controls src={audioUrl} className="w-full" /></div>}
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="font-bold">تقييم النطق بالذكاء الاصطناعي: غير متاح بعد</p>
      <p className="mt-2 text-sm leading-7">بعد تفعيل خدمة التقييم، ستظهر دقة النطق على مقياس من 0 إلى 10 وملاحظات على الكلمات. لا توجد درجة لهذه المحاولة الآن. يمكنك متابعة الدرس دون تقييم.</p>
      <ol aria-label="مقياس التقييم غير مفعّل" dir="ltr" className="mt-3 grid grid-cols-10 gap-1">{Array.from({ length: 10 }, (_, index) => <li key={index} className="rounded bg-background-soft py-2 text-center text-xs text-muted">{index + 1}</li>)}</ol>
    </div>
  </div>;
}
