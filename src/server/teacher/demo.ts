import "server-only";
import type { Teacher, TeacherLesson } from "@/lib/teacher/types";
import { safeTeacherUrl } from "@/lib/teacher/urls";
const date = "2026-10-04T00:00:00.000Z";
/** Deliberately a fictional test teacher. Booking/social destinations require explicit configuration. */
export const demoTeacher: Teacher = {
  id: "teacher-demo", email: "demo-teacher@example.invalid", slug: "demo-teacher",
  displayName: "Демо-преподаватель", photoUrl: "/teachers/demo-avatar.svg",
  bio: "Тестовый профиль EspanolReal. Здесь можно проверить урок и переходы к преподавателю. Это не предложение реальных занятий.",
  lessonRate: 20, currency: "EUR", status: "active", createdAt: date, updatedAt: date,
  calendlyUrl: safeTeacherUrl(process.env.TEACHER_DEMO_CALENDLY_URL, "calendly"),
  telegramUrl: safeTeacherUrl(process.env.TEACHER_DEMO_TELEGRAM_URL, "telegram"),
  whatsappUrl: safeTeacherUrl(process.env.TEACHER_DEMO_WHATSAPP_URL, "whatsapp"),
  vkUrl: safeTeacherUrl(process.env.TEACHER_DEMO_VK_URL, "vk"),
};
export const demoLesson: TeacherLesson = {
  id: "teacher-lesson-demo-cafe", teacherId: demoTeacher.id, slug: "demo-pedir-en-un-cafe",
  status: "published", seoStatus: "pending", indexReason: "Phase 1 demonstration; not reviewed for indexing.",
  title: "Как заказать в кафе по-испански", subtitle: "Вежливая просьба и короткий разговор у стойки",
  summary: "Потренируйте три способа заказать напиток и попросить счёт. Мини-урок для начинающих.",
  explanation: "В Испании в кафе можно сказать «Un café con leche, por favor». «Quisiera…» — вежливое «Я хотел(а) бы…». Вопрос «¿Me trae la cuenta, por favor?» поможет попросить счёт. Добавляйте por favor и gracias, чтобы просьба звучала вежливо.",
  topic: "Кафе и ресторан", level: "A1", language: "ru", estimatedMinutes: 5,
  contentBlocks: [
    { id: "ex-1", type: "example", spanish: "Un café con leche, por favor.", translation: "Кофе с молоком, пожалуйста." },
    { id: "ex-2", type: "example", spanish: "Quisiera un té, por favor.", translation: "Я хотел(а) бы чай, пожалуйста." },
    { id: "ex-3", type: "example", spanish: "¿Me trae la cuenta, por favor?", translation: "Принесите мне счёт, пожалуйста." },
    { id: "tip", type: "text", text: "Попробуйте произнести каждую фразу вслух, затем переходите к практике." },
  ],
  questions: [
    { id: "q1", type: "choice", prompt: "Как попросить кофе с молоком?", options: ["Un café con leche, por favor.", "La cuenta, por favor.", "Un té, por favor."], answerIndex: 0, explanation: "Café con leche — кофе с молоком." },
    { id: "q2", type: "choice", prompt: "Что означает «Quisiera un té»?", options: ["Принесите счёт", "Я хотел(а) бы чай", "Где кафе?"], answerIndex: 1, explanation: "Quisiera выражает вежливое пожелание." },
    { id: "q3", type: "text", prompt: "Напишите по-испански: «Счёт, пожалуйста». Используйте la cuenta.", acceptedAnswers: ["La cuenta, por favor", "La cuenta por favor"], explanation: "La cuenta — счёт. Por favor — пожалуйста." },
  ],
  seoTitle: "Как заказать в кафе — тестовый интерактивный урок",
  seoDescription: "Примеры и короткая практика заказа в кафе. Демонстрационный урок преподавателя EspanolReal.",
  canonicalUrl: "https://espanolreal.es/practice/demo-pedir-en-un-cafe",
  createdAt: date, publishedAt: date, updatedAt: date,
};
