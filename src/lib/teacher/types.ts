/** Independent user content: never a course Lesson or ProgressEvent. */
export type TeacherStatus = "active" | "inactive";
export interface Teacher {
  id: string;
  email: string; // Server-only identity; never part of a public projection.
  slug: string;
  displayName: string;
  photoUrl: string;
  bio?: string;
  lessonRate?: number;
  currency?: string;
  calendlyUrl?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
  vkUrl?: string;
  status: TeacherStatus;
  createdAt: string;
  updatedAt: string;
}
export type PublicTeacher = Omit<Teacher, "email" | "createdAt" | "updatedAt">;
export type ContentBlock =
  | { id: string; type: "text"; text: string }
  | { id: string; type: "example"; spanish: string; translation: string; note?: string };
interface QuestionBase { id: string; prompt: string; explanation: string }
export type TeacherQuestion =
  | (QuestionBase & { type: "choice"; options: string[]; answerIndex: number })
  | (QuestionBase & { type: "text"; acceptedAnswers: string[] });
export interface TeacherLesson {
  id: string;
  teacherId: string;
  slug: string;
  status: "draft" | "published";
  title: string;
  subtitle: string;
  summary: string;
  explanation: string;
  topic: string;
  level: string;
  language: string;
  estimatedMinutes: number;
  contentBlocks: ContentBlock[];
  questions: TeacherQuestion[];
  sourceText?: string;
  sourceUrl?: string;
  seoTitle: string;
  seoDescription: string;
  searchIntent?: string;
  seoStatus: "pending" | "index" | "noindex";
  indexReason?: string;
  canonicalUrl: string;
  createdAt: string;
  publishedAt?: string;
  updatedAt: string;
}
