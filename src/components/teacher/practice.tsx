"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trackTeacherEvent, type TeacherEventContext } from "@/lib/teacher/analytics";
import { checkTeacherAnswer, teacherQuestionAnswer } from "@/lib/teacher/practice";
import type { PublicTeacher, TeacherLesson } from "@/lib/teacher/types";
import { TeacherContacts } from "./public-ui";

/** Local practice state only. No ProgressProvider, course events, payments or Lesson adapter. */
export function TeacherPractice({ lesson, teacher, context }: { lesson: TeacherLesson; teacher: PublicTeacher; context: TeacherEventContext }) {
  const [phase, setPhase] = useState<"intro" | "run" | "done">("intro");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | number>("");
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const submitted = useRef(false);
  const advanced = useRef(false);
  useEffect(() => { advanced.current = false; }, [index, phase]);
  const question = lesson.questions[index];
  if (!lesson.questions.length) return <p>Практика пока недоступна.</p>;
  if (phase === "intro") return <Button size="lg" block onClick={() => {
    submitted.current = false; setPhase("run");
    trackTeacherEvent("teacher_lesson_start", context);
  }}>Начать практику</Button>;
  if (phase === "done") return <Card className="space-y-5 p-6"><h2 className="text-2xl font-black" tabIndex={-1}>Практика завершена</h2><p role="status" className="text-lg font-bold">Результат: {score} из {lesson.questions.length}</p><p className="text-muted">Повторите примеры или продолжайте практику с преподавателем.</p><TeacherContacts teacher={teacher} context={context} bookingOnly/><Link href="/learn" className="block font-bold text-primary">Продолжить заниматься в EspanolReal →</Link><Button variant="secondary" onClick={() => {
    setIndex(0); setScore(0); setAnswer(""); setFeedback(null); submitted.current = false;
    setPhase("run"); trackTeacherEvent("teacher_lesson_start", context);
  }}>Повторить практику</Button></Card>;
  const canSubmit = question.type === "choice" ? typeof answer === "number" : typeof answer === "string" && answer.trim().length > 0;
  function submit() {
    if (submitted.current || !canSubmit) return;
    submitted.current = true;
    const correct = checkTeacherAnswer(question, answer);
    setFeedback(correct); if (correct) setScore(value => value + 1);
    trackTeacherEvent("teacher_question_answered", { ...context, question_id: question.id, question_type: question.type, correct });
  }
  function next() {
    if (feedback === null || advanced.current) return;
    advanced.current = true;
    if (index + 1 === lesson.questions.length) {
      setPhase("done"); trackTeacherEvent("teacher_lesson_complete", { ...context, score, total: lesson.questions.length });
    } else {
      setIndex(value => value + 1); setAnswer(""); setFeedback(null); submitted.current = false;
    }
  }
  return <Card className="space-y-5 p-5 sm:p-7"><p className="font-bold text-muted">Вопрос {index + 1} из {lesson.questions.length}</p><progress className="h-3 w-full accent-primary" aria-label="Прогресс практики" max={lesson.questions.length} value={index}/><h2 className="text-xl font-black">{question.prompt}</h2>
    <form onSubmit={event => { event.preventDefault(); if (feedback === null) submit(); else next(); }} className="space-y-4">
      {question.type === "choice" ? <fieldset disabled={feedback !== null} className="space-y-3"><legend className="sr-only">Выберите ответ</legend>{question.options.map((option, optionIndex) => <label key={optionIndex} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 ${answer === optionIndex ? "border-primary bg-primary/10" : "border-line"}`}><input type="radio" name={question.id} value={optionIndex} checked={answer === optionIndex} onChange={() => setAnswer(optionIndex)} className="h-5 w-5 shrink-0 accent-primary"/><span>{option}</span></label>)}</fieldset> : <label className="block space-y-2"><span className="text-sm font-bold">Ваш ответ по-испански</span><input value={typeof answer === "string" ? answer : ""} onChange={event => setAnswer(event.target.value)} disabled={feedback !== null} maxLength={500} autoComplete="off" className="min-h-14 w-full rounded-2xl border-2 border-line bg-surface p-3 text-base focus:border-primary"/></label>}
      {feedback !== null ? <div role="status" className={`space-y-2 rounded-2xl p-4 ${feedback ? "bg-success-soft" : "bg-danger-soft"}`}><p className="font-bold">{feedback ? "Верно!" : "Посмотрите правильный ответ"}</p><p>{teacherQuestionAnswer(question)}</p><p>{question.explanation}</p></div> : null}
      <Button type="submit" size="lg" block disabled={feedback === null && !canSubmit}>{feedback === null ? "Проверить" : index + 1 === lesson.questions.length ? "Завершить практику" : "Следующий вопрос"}</Button>
    </form>
  </Card>;
}
