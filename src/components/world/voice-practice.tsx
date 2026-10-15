"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function VoicePractice() {
  const [status, setStatus] = useState("Запиши фразу и послушай себя. Это необязательно.");
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState<Blob | null>(null);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const pending = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; if (timer.current) clearTimeout(timer.current); if (recorder.current?.state === "recording") recorder.current.stop(); stream.current?.getTracks().forEach(t => t.stop()); void audio.current?.close().catch(() => {}); };
  }, []);
  async function replay() {
    if (!clip || audio.current) return;
    try {
      // Decode in memory: no blob URL or media-src policy relaxation is needed.
      const ctx = new AudioContext(); audio.current = ctx; setPlaying(true);
      await ctx.resume();
      const buffer = await ctx.decodeAudioData(await clip.arrayBuffer());
      if (!alive.current || ctx.state === "closed") return;
      const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(ctx.destination);
      source.onended = () => { void ctx.close().catch(() => {}); audio.current = null; if (alive.current) setPlaying(false); };
      source.start();
    } catch {
      void audio.current?.close().catch(() => {}); audio.current = null;
      if (alive.current) { setPlaying(false); setStatus("Не удалось воспроизвести запись. Можно попробовать ещё раз или продолжить."); }
    }
  }
  async function start() {
    if (pending.current || recorder.current?.state === "recording") return;
    pending.current = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error();
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current = media;
      const rec = new MediaRecorder(media), chunks: BlobPart[] = [];
      recorder.current = rec;
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        media.getTracks().forEach(t => t.stop());
        if (timer.current) clearTimeout(timer.current);
        if (!alive.current) return;
        setRecording(false);
        if (chunks.length) { setClip(new Blob(chunks, { type: rec.mimeType })); setStatus("Послушай свою запись. Она остаётся в этом браузере и не отправляется на сервер."); }
        else setStatus("Запись пустая. Можно попробовать ещё раз или продолжить.");
      };
      rec.onerror = () => { media.getTracks().forEach(t => t.stop()); if (alive.current) { setRecording(false); setStatus("Не удалось записать. Можно продолжить без микрофона."); } };
      rec.start(); setRecording(true); setStatus("Говори. Запись остановится через 12 секунд.");
      timer.current = setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 12000);
    } catch { stream.current?.getTracks().forEach(t => t.stop()); if (alive.current) setStatus("Микрофон недоступен. Произнеси фразу вслух и продолжай."); }
    finally { pending.current = false; }
  }
  return <div className="space-y-3 rounded-2xl bg-background-soft p-4">
    <p className="font-semibold">Попробуй произнести</p>
    <p className="text-sm text-muted" role="status">{status}</p>
    <Button variant="secondary" disabled={playing} onClick={recording ? () => recorder.current?.stop() : start}>{recording ? "Остановить запись" : "Записать себя"}</Button>
    {clip && <Button variant="secondary" disabled={playing || recording} onClick={replay}>{playing ? "Воспроизведение…" : "Послушать свою запись"}</Button>}
    <p className="text-xs text-muted">Автоматической оценки произношения здесь пока нет.</p>
  </div>;
}
