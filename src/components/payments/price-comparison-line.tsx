"use client";
import { useEffect, useState } from "react";
import { comparisonFor, type PriceComparison } from "@/lib/payments/comparisons";

const SEED_KEY = "espanolreal:price-variant:v1";

/** Guest-side comparison: one stable seed per browser, so a visitor keeps seeing the same line. */
function guestSeed(): string {
  try {
    const saved = localStorage.getItem(SEED_KEY);
    if (saved) return saved;
    const created = Math.random().toString(36).slice(2);
    localStorage.setItem(SEED_KEY, created);
    return created;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

export function PriceComparisonLine({ seed, className }: { seed?: number | string; className?: string }) {
  // Chosen after hydration so server HTML and the first client render agree.
  const [comparison, setComparison] = useState<PriceComparison | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setComparison(comparisonFor(seed ?? guestSeed())), 0);
    return () => window.clearTimeout(timer);
  }, [seed]);
  if (!comparison) return null;
  return <p className={className ?? "text-sm font-semibold text-foreground"} data-variant={comparison.id}>{comparison.text}</p>;
}
