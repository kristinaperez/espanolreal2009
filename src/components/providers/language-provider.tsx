"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppLanguage = "ru" | "fr" | "ar";

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "espanol-real:interface-language";

export function LanguageProvider({ children, initialLanguage = "ru" }: { children: ReactNode; initialLanguage?: AppLanguage }) {
  const [language, setLanguage] = useState<AppLanguage>(initialLanguage);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
    // Arabic URLs are authoritative. Other routes preserve the selected RU/FR prototype.
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      setLanguage(initialLanguage === "ar" ? "ar" : saved === "fr" ? "fr" : "ru");
    } catch { setLanguage(initialLanguage); }
    setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialLanguage]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(STORAGE_KEY, language); } catch { /* The locale still works when storage is unavailable. */ }
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language, ready]);

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
