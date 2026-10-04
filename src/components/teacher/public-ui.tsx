"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { trackTeacherEvent, type TeacherEvent, type TeacherEventContext } from "@/lib/teacher/analytics";
import type { PublicTeacher } from "@/lib/teacher/types";
import { safeTeacherUrl } from "@/lib/teacher/urls";

export function TeacherPageFrame({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh"><header className="border-b border-line bg-surface"><nav aria-label="Навигация" className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 p-4"><Link href="/" className="font-extrabold">🇪🇸 Español Real</Link><div className="flex gap-4 text-sm font-bold"><Link href="/teachers">Учителя</Link><Link href="/learn">Тренажёр</Link></div></nav></header><main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">{children}</main></div>;
}
export function TeacherView({ event, context }: { event: TeacherEvent; context: TeacherEventContext }) {
  const seen = useRef("");
  useEffect(() => {
    const key = `${event}:${context.source_page}`;
    if (seen.current === key) return;
    seen.current = key;
    trackTeacherEvent(event, context);
  }, [event, context]);
  return null;
}
export function TeacherAttribution({ teacher, context }: { teacher: PublicTeacher; context: TeacherEventContext }) {
  return <Link href={`/teachers/${teacher.slug}`} onClick={() => trackTeacherEvent("teacher_author_click", context)} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"><Image src={teacher.photoUrl} alt="" width={48} height={48} className="h-12 w-12 rounded-full"/><span><span className="block text-xs text-muted">Преподаватель</span><span className="font-bold">{teacher.displayName} →</span></span></Link>;
}
export function TeacherContacts({ teacher, context, bookingOnly = false }: { teacher: PublicTeacher; context: TeacherEventContext; bookingOnly?: boolean }) {
  const booking = safeTeacherUrl(teacher.calendlyUrl, "calendly");
  const social = [
    { kind: "telegram" as const, label: "Telegram", url: teacher.telegramUrl },
    { kind: "whatsapp" as const, label: "WhatsApp", url: teacher.whatsappUrl },
    { kind: "vk" as const, label: "VK", url: teacher.vkUrl },
  ];
  return <div className="flex flex-wrap gap-3">
    {booking ? <a href={booking} target="_blank" rel="noopener noreferrer" onClick={() => trackTeacherEvent("teacher_booking_click", { ...context, booking_provider: "calendly" })} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-5 py-3 font-bold text-primary-contrast">Записаться на урок к {teacher.displayName}</a> : null}
    {!bookingOnly ? social.map(item => {
      const href = safeTeacherUrl(item.url, item.kind);
      return href ? <a key={item.kind} href={href} target="_blank" rel="noopener noreferrer" onClick={() => trackTeacherEvent("teacher_social_click", { ...context, social_provider: item.kind })} className="inline-flex min-h-12 items-center rounded-2xl border border-line px-4 font-semibold">{item.label}</a> : null;
    }) : null}
  </div>;
}
