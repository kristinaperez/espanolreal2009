"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { TelegramLogin } from "@/components/auth/telegram-login";
import { TelegramStarsPayment } from "@/components/payments/telegram-stars";
import { trackArabicEvent } from "@/lib/arabic/analytics";
export function ArabicAccount() {
  const { user, status, account } = useAuth();
  const wasGuest = useRef(false);
  useEffect(() => {
    if (status !== "server") return;
    if (!user) wasGuest.current = true;
    else if (wasGuest.current) { wasGuest.current = false; trackArabicEvent("arabic_signup"); }
  }, [user, status]);
  return <div className="space-y-6">
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-6"><h2 className="text-2xl font-bold">تسجيل الدخول</h2><p className="leading-8">الدروس العربية الثلاثة مجانية ولا تحتاج إلى حساب. تسجيل الدخول عبر Telegram مخصص للشراء واستعادته. تقدّم الدروس محفوظ في هذا المتصفح، ولا ينتقل تلقائيًا إلى جهاز آخر.</p><TelegramLogin /></section>
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-6"><h2 className="text-2xl font-bold">الدورة الأصلية وPremium</h2><p className="leading-8">Premium يفتح الدورة الأصلية، وهي بالروسية أساسًا، مع تجربة فرنسية محدودة. لا يعني الشراء أن جميع الدروس الـ45 مترجمة إلى العربية. جرّب الدروس العربية الثلاثة مجانًا قبل اتخاذ قرار الشراء.</p>{status === "server" && account?.configured ? <TelegramStarsPayment /> : <p className="text-muted">يظهر خيار الشراء عندما تتوفر خدمة الحساب والدفع.</p>}</section>
  </div>;
}
