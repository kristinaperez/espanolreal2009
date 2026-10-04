import type { TeacherQuestion } from "./types";
export function normalizeTeacherAnswer(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("es").replace(/\s+/g, " ").replace(/[.!?¿¡]+$/g, "").replace(/^[¿¡]+/g, "");
}
export function checkTeacherAnswer(question: TeacherQuestion, answer: string | number): boolean {
  return question.type === "choice"
    ? typeof answer === "number" && answer === question.answerIndex
    : typeof answer === "string" && question.acceptedAnswers.some(expected => normalizeTeacherAnswer(expected) === normalizeTeacherAnswer(answer));
}
export function teacherQuestionAnswer(question: TeacherQuestion): string {
  return question.type === "choice" ? question.options[question.answerIndex] : question.acceptedAnswers[0];
}
