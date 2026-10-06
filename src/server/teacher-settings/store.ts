import "server-only";
import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";
import type { TeacherSocialLinks } from "@/lib/teacher-socials";
function store() {
 const context = process.env.CONTEXT;
 const scope = !context || context === "production" ? "production" : createHash("sha256").update(process.env.DEPLOY_PRIME_URL || context).digest("hex").slice(0,12);
 return getStore({ name: `teacher-settings-${scope}`, consistency: "strong" });
}
export async function readTeacherSocials(telegramId: number): Promise<TeacherSocialLinks> {
 return await store().get(`socials/${telegramId}`, { type: "json" }) as TeacherSocialLinks | null ?? {};
}
export async function saveTeacherSocials(telegramId: number, links: TeacherSocialLinks): Promise<void> {
 await store().setJSON(`socials/${telegramId}`, links);
}
