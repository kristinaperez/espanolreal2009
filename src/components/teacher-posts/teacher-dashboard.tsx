"use client";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { TelegramLogin } from "@/components/auth/telegram-login";
import { HeaderNavUpdate } from "@/components/layout/header-nav-update";
export function TeacherDashboard() {
  const { user, botUsername, status } = useAuth();
  return <div className="min-h-dvh bg-[#FAF8F5] text-stone-900"><HeaderNavUpdate /><main className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><p className="text-sm font-bold text-[#9E2A2B]">Español Real · Преподавателям</p><h1 className="mt-4 text-3xl font-extrabold">{user ? `Добро пожаловать, ${user.firstName || user.username || "преподаватель"}` : "Ваши знания заслуживают ярких постов"}</h1><p className="mt-4 leading-7 text-stone-600">Превращайте свои заметки в понятные разборы с интерактивом. Редактируйте, копируйте и делитесь со своей аудиторией.</p><section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="mb-4 text-lg font-bold">Аккаунт преподавателя</h2>{status === "loading" ? <p>Проверяем вход…</p> : botUsername || user ? <TelegramLogin variant="compact" /> : <p className="text-sm text-stone-600">Вход временно недоступен. Генератор можно попробовать в тестовом режиме.</p>}</section><div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold"><Link href="/teachers">Преподаватели и демо-уроки →</Link><Link href="/learn">Вернуться к курсу →</Link></div></main></div>;
}
