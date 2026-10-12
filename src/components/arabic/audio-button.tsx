"use client";
import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { trackArabicEvent } from "@/lib/arabic/analytics";
export function AudioButton({ spanish, lessonId, onPlayed }: { spanish: string; lessonId?: string; onPlayed?: () => void }) {
  const [status, setStatus] = useState<"idle" | "playing" | "unavailable">("idle");
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);
  function play() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) { setStatus("unavailable"); return; }
    const voice = new SpeechSynthesisUtterance(spanish);
    voice.lang = "es-ES";
    voice.voice = window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase() === "es-es") ?? null;
    voice.rate = 0.85;
    voice.onstart = () => { setStatus("playing"); trackArabicEvent("arabic_audio_play", lessonId); onPlayed?.(); };
    voice.onend = () => setStatus("idle");
    voice.onerror = () => setStatus("unavailable");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(voice);
  }
  return <span className="inline-flex flex-col items-start gap-1">
    <button type="button" onClick={play} aria-label={`استمع: ${spanish}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-bold text-primary"><Volume2 size={18} />{status === "playing" ? "جارٍ النطق…" : "استمع"}</button>
    {status === "unavailable" && <span role="status" className="text-xs text-muted">الصوت غير متاح في هذا المتصفح. يمكنك متابعة القراءة والتدريب.</span>}
  </span>;
}
