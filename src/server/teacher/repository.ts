import "server-only";
import { demoLesson, demoTeacher } from "./demo";
import type { PublicTeacher, Teacher } from "@/lib/teacher/types";
import { safeTeacherUrl } from "@/lib/teacher/urls";
/** Explicit public projection: email never crosses the server/client boundary. */
export function publicTeacher(teacher: Teacher): PublicTeacher {
  return {
    id: teacher.id, slug: teacher.slug, displayName: teacher.displayName, photoUrl: teacher.photoUrl,
    bio: teacher.bio, lessonRate: teacher.lessonRate, currency: teacher.currency, status: teacher.status,
    calendlyUrl: safeTeacherUrl(teacher.calendlyUrl, "calendly"),
    telegramUrl: safeTeacherUrl(teacher.telegramUrl, "telegram"),
    whatsappUrl: safeTeacherUrl(teacher.whatsappUrl, "whatsapp"),
    vkUrl: safeTeacherUrl(teacher.vkUrl, "vk"),
  };
}
/** Phase 1 fixture repository; no production database read/write dependency. */
export function getPublicTeachers() { return demoTeacher.status === "active" ? [publicTeacher(demoTeacher)] : []; }
export function getPublicTeacher(slug: string) { return getPublicTeachers().find(teacher => teacher.slug === slug); }
export function getPublicTeacherLessons(teacherId: string) {
  return demoLesson.status === "published" && demoLesson.teacherId === teacherId && getPublicTeachers().some(t => t.id === teacherId) ? [demoLesson] : [];
}
export function getPublicTeacherLesson(slug: string) {
  return getPublicTeacherLessons(demoTeacher.id).find(lesson => lesson.slug === slug);
}
