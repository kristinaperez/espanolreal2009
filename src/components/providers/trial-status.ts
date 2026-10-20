"use client";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
export function useTrialStatus() {
  const { user } = useAuth();
  const [trial, setTrial] = useState<{active: boolean; expiresAt: string | null} | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => { void fetch("/api/trial", { cache: "no-store" }).then(async r => {
      if (r.ok && !cancelled) setTrial(await r.json());
    }).catch(() => undefined); };
    load(); const timer = window.setInterval(load, 30000);
    window.addEventListener("focus", load); window.addEventListener("er-trial-changed", load);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener("focus", load); window.removeEventListener("er-trial-changed", load); };
  }, [user?.telegramId]);
  return trial;
}
