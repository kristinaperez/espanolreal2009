"use client";

import { useEffect, useState } from "react";
import type { IndexedPhrase } from "@/lib/content/types";
import { useAuth } from "@/components/providers/auth-provider";

export function useAuthorizedPhraseIndex(initial: IndexedPhrase[]): IndexedPhrase[] {
  const { serverPremium, status } = useAuth();
  const [remote, setRemote] = useState<{ initial: IndexedPhrase[]; phrases: IndexedPhrase[] } | null>(null);

  useEffect(() => {
    if (status !== "server" || !serverPremium) return;
    let cancelled = false;
    void fetch("/api/phrases", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`status ${response.status}`);
        return response.json() as Promise<{ phrases?: IndexedPhrase[] }>;
      })
      .then((payload) => {
        if (!cancelled && Array.isArray(payload.phrases)) setRemote({ initial, phrases: payload.phrases });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [initial, serverPremium, status]);

  return status === "server" && serverPremium && remote?.initial === initial ? remote.phrases : initial;
}
