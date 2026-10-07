import Link from "next/link";
import { Card } from "@/components/ui/card";
import { categoryById } from "@/lib/content/config";
import type { Lesson, LessonMeta } from "@/lib/content/types";
import { getTopicForLesson } from "@/lib/seo/topics";

export function LessonIntro({
  lesson,
  prev,
  next,
  protectedContent,
}: {
  lesson: Lesson;
  prev: LessonMeta | null;
  next: LessonMeta | null;
  protectedContent: boolean;
}) {
  const category = categoryById.get(lesson.category);
  const topic = getTopicForLesson(lesson.lesson);
  const summary = lesson.summary ?? lesson.subtitle ?? lesson.situation;
  const heading = summary ? `${summary.replace(/[.!?]+$/, "")} — ${lesson.title}` : `Урок ${lesson.lesson}: ${lesson.title}`;

  return (
    <section className="mb-6 flex flex-col gap-4" aria-labelledby="lesson-public-title">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted">
        <Link href="/" className="underline decoration-line underline-offset-4">Español Real</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/learn/lessons" className="underline decoration-line underline-offset-4">Уроки</Link>
        <span aria-hidden="true"> / </span>
        <span>Урок {lesson.lesson}</span>
      </nav>

      <header className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
          Урок {lesson.lesson} · {category?.labelRu ?? lesson.category} · {lesson.difficulty}
        </p>
        <h1 id="lesson-public-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {heading}
        </h1>
        {lesson.situation ? <p className="max-w-3xl text-base text-muted">{lesson.situation}</p> : null}
        {summary ? <p className="max-w-3xl text-base">{summary}</p> : null}
      </header>

      {lesson.phrases.length > 0 ? (
        <Card>
          <h2 className="text-base font-extrabold">Примеры фраз из урока</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {lesson.phrases.slice(0, 2).map((phrase) => (
              <li key={phrase.spanish}>
                <p lang="es" className="font-bold">{phrase.spanish}</p>
                <p className="text-sm text-muted">{phrase.translation}</p>
              </li>
            ))}
          </ul>
          {protectedContent ? (
            <p className="mt-3 text-sm text-muted">
              Полная практика этого урока доступна после открытия Premium. Публичное описание и примеры доступны без входа.
            </p>
          ) : null}
        </Card>
      ) : null}

      <nav aria-label="Навигация по урокам" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link href="/learn/lessons" className="font-bold text-primary underline decoration-primary/40">Все уроки</Link>
        {topic ? <Link href={`/topics/${topic.slug}`} className="font-bold text-primary underline decoration-primary/40">Тема: {topic.title}</Link> : null}
        {prev ? <Link href={`/lesson/${prev.lesson}`} className="font-bold text-primary underline decoration-primary/40">← Урок {prev.lesson}</Link> : null}
        {next ? <Link href={`/lesson/${next.lesson}`} className="font-bold text-primary underline decoration-primary/40">Урок {next.lesson} →</Link> : null}
      </nav>
    </section>
  );
}
