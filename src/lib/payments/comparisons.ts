import { payments } from "@/lib/content/config";

export type PriceComparison = { id: string; text: string; source?: string };

/** Comparisons shown next to the price; edited in data/course.config.json. */
export function comparisons(): PriceComparison[] {
  return payments.comparisons;
}

/** FNV-1a: a tiny stable hash so one person always sees the same comparison. */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function comparisonFor(seed: number | string): PriceComparison {
  const list = comparisons();
  return list[hash(String(seed)) % list.length];
}

/** Only ids from the configured list reach the database. */
export function knownVariant(id: unknown): string | null {
  return typeof id === "string" && comparisons().some((item) => item.id === id) ? id : null;
}
