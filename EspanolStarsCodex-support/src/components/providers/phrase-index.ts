"use client";

import { useEffect, useState } from "react";
import type { IndexedPhrase } from "@/lib/content/types";
import { useAuth } from "@/components/providers/auth-provider";

export function useAuthorizedPhraseIndex(initial: IndexedPhrase[]): IndexedPhrase[] {
  const { serverPremium, status } = useAuth();
  const [phrases, setPhrases] = useState(initial);

  useEffect(() => setPhrases(initial), [initial]);

  useEffect(() => {
    if (status !== "server" || !serverPremium) return;
    let cancelled = false;
    void fetch("/api/phrases", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`status ${response.status}`);
        return response.json() as Promise<{ phrases?: IndexedPhrase[] }>;
      })
      .then((payload) => {
        if (!cancelled && Array.isArray(payload.phrases)) setPhrases(payload.phrases);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [serverPremium, status]);

  return phrases;
}
