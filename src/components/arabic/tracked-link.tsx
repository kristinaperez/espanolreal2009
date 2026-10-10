"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { trackArabicEvent, type ArabicEvent } from "@/lib/arabic/analytics";
export function ArabicTrackedLink({ href, lessonId, children, event = "arabic_cta_click", secondary = false }: { href: string; lessonId?: string; children: ReactNode; event?: ArabicEvent; secondary?: boolean }) {
  return <Link href={href} onClick={() => trackArabicEvent(event, lessonId)} className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-6 py-3 text-center font-bold ${secondary ? "border border-line bg-surface" : "bg-primary text-white shadow-sm"}`}>{children}</Link>;
}
