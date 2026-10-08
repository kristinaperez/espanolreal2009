import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ProgressProvider } from "@/components/providers/progress-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { PwaRegister } from "@/components/providers/pwa-register";
import { getLessonMetas } from "@/lib/content/loader";
import { course } from "@/lib/content/config";
import "./globals.css";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";

const siteUrl = "https://espanolreal.es";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Español Real — учим живой испанский для жизни в Испании",
    template: "%s · Español Real",
  },
  description:
    "Мастерство реальных испанских фраз вместо заучивания грамматики. 45 уроков по учебнику «Español Real»: квартира, банк, врач, документы, работа.",
  keywords: [
    "испанский язык",
    "испанский для жизни в Испании",
    "разговорный испанский",
    "Español Real",
    "курс испанского",
    "испанский для эмигрантов",
  ],
  applicationName: "Español Real",
  authors: [{ name: course.author.name }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Español Real",
    title: "Español Real — живой испанский для жизни в Испании",
    description:
      "Реальные фразы, которые слышно на улицах Испании. Карта адаптации, повторение по расписанию, 45 уроков.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Español Real" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Español Real — живой испанский для жизни в Испании",
    description: "Мастерство реальных фраз вместо заучивания грамматики. 45 уроков.",
  },
  robots: { index: true, follow: true },
  verification: {
    google: "XsPAnFMeuRke9Fc9xUfdFIEP0mJKmpbsC2_pgy7OkUE",
  },
  icons: {
  icon: [{ url: "/icon.png", type: "image/png" }],
  apple: "/icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#D32F2F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const metas = getLessonMetas();

  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <Script
          src="https://static.userguiding.com/media/user-guiding-8SS114332UJ2ID-embedded.js"
          strategy="afterInteractive"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=localStorage.getItem('espanol-real:progress:v1');var t=r?((JSON.parse(r).settings||{}).theme):'system';var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <LanguageProvider>
          <ProgressProvider metas={metas}>
            <AuthProvider>{children}</AuthProvider>
          </ProgressProvider>
        </LanguageProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
