"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

const KEY = "espanolreal:analytics-consent:v1";
const GA = "G-9XC97505BR";
const YM = 113580037;
type Choice = "accepted" | "rejected" | null;
declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; ym?: (...args: unknown[]) => void; } }

export function ConsentAnalytics() {
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);
  const [gaReady, setGaReady] = useState(false);
  const [ymReady, setYmReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Read persisted consent after mount without synchronous state updates in an effect.
    const readConsent = () => {
      try {
        const value = localStorage.getItem(KEY);
        setChoice(value === "accepted" || value === "rejected" ? value : null);
      } catch {
        setChoice(null);
      }
      setReady(true);
    };
    const frame = window.requestAnimationFrame(readConsent);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (choice !== "accepted") return;
    if (gaReady) window.gtag?.("event", "page_view", { page_path: pathname });
    if (ymReady) window.ym?.(YM, "hit", window.location.href);
  }, [choice, gaReady, ymReady, pathname]);

  function decide(value: Exclude<Choice, null>) {
    try { localStorage.setItem(KEY, value); } catch {}
    setChoice(value);
    if (value === "rejected") {
      setGaReady(false);
      setYmReady(false);
    }
  }

  return <>
    {choice === "accepted" && <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
      <Script id="espanolreal-ga" strategy="afterInteractive" onReady={() => {
        window.dataLayer = window.dataLayer || [];
        window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
        window.gtag("js", new Date());
        window.gtag("config", GA, { send_page_view: false });
        setGaReady(true);
      }} />
      <Script id="espanolreal-ym" strategy="afterInteractive" onReady={() => {
        window.ym = window.ym || ((...args: unknown[]) => {
          const fn = window.ym as ((...a: unknown[]) => void) & { a?: unknown[][] };
          (fn.a = fn.a || []).push(args);
        });
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://mc.yandex.ru/metrika/tag.js?id=${YM}`;
        document.head.appendChild(script);
        window.ym(YM, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false, defer: true });
        setYmReady(true);
      }} />
    </>}
    {ready && choice === null && <div role="dialog" aria-label="Согласие на аналитику" className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-xl rounded-xl border border-gray-300 bg-white p-4 text-gray-900 shadow-xl">
      <p className="text-sm">Google Analytics и Яндекс Метрика помогают улучшать EspañolReal. Они запускаются только с вашего согласия. Отказ не влияет на уроки. <a href="/privacy" className="underline">Подробнее</a>.</p>
      <div className="mt-3 flex gap-3">
        <button type="button" className="rounded-lg border border-gray-400 px-4 py-2 text-sm" onClick={() => decide("rejected")}>Отказаться</button>
        <button type="button" className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white" onClick={() => decide("accepted")}>Разрешить аналитику</button>
      </div>
    </div>}
    {ready && choice !== null && <button type="button" className="fixed bottom-2 left-2 z-[90] rounded bg-white px-2 py-1 text-xs text-gray-700 shadow" onClick={() => {
      try { localStorage.removeItem(KEY); } catch {}
      setChoice(null);
      window.location.reload();
    }}>Настройки cookies</button>}
  </>;
}
