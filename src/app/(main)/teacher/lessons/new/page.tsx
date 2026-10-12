import { TeacherPostGenerator } from "@/components/teacher-posts/teacher-post-generator";
export { metadata } from "@/app/(main)/teacher/posts/new/page";
/** Compatibility entry only. Does not create or mutate TeacherLesson. */
export default function Page() { return <TeacherPostGenerator />; }
