import { findSituation } from "./lessons";
export function pronunciationPhrases(slug: string): string[] {
  const lesson = findSituation(slug);
  return lesson ? [...new Set([...lesson.vocabulary.map(item => item.spanish), ...lesson.phrases.map(item => item.spanish)])] : [];
}
