# WOW social posts and responsive landing

User scope update: keep existing TeacherLesson/demo practice unchanged; build a social post studio. Canonical generator: `/teacher/posts/new`; `/teacher/lessons/new` is a compatibility entry to the same post UI, not a lesson editor. `/teacher` provides Telegram login. Header links open the generator; guests can generate a labelled template directly, with optional Telegram login for AI/publication; successful existing Telegram auth leaves them in the generator. Email/magic-link authentication is not added.

## Component architecture

- `HeaderNavUpdate`: shared landing/teacher navigation, compact accessible language switcher, desktop menu, mobile disclosure menu and full-width create action.
- `TeacherPostGenerator`: input, request lifecycle, loading/error state, per-account local draft, preview/edit, publication and export.
- `PostEditor`: typed structured block editing including quiz/options/correct answer.
- `PostPreview`: escaped text rendering, local interactive quiz; no course progress hooks or dispatches.
- `TeacherDashboard`: account gate and create entry.
- `PublicPost`: static shell with public read API for a published post. This preserves the existing static build capability. URL: `/teacher/posts/view?slug=post-<uuid>`.
- `lib/teacher-posts/model`: `LessonDraft`, `WowPost`, `GeneratedPost`, `TeacherPost`, strict runtime validation, HTTPS URL validation, CTA policy, plain-text export and provider JSON Schema. Existing `TeacherLesson` remains in its original module.
- `server/teacher-posts`: source-grounded mock, optional OpenAI Responses adapter, same-origin mutation guard, transaction-backed repository.

## Generation

`POST /api/teacher/posts/generate` takes draft fields, including `sourceText`, optional topic, tone, level, teacher lesson links, and optional `mode: "mock"`. Returns `{ ok, post: { title, hook, example, explanation, interactiveQuestion }, cta, mode }`.

Without both `OPENAI_API_KEY` and `TEACHER_POST_AI_MODEL`, it returns a clearly labelled template, preserves the original explanation, and creates a recall quiz. No fabricated grammar or culture claims. Explicit test mode works without login even when AI is configured. It is not AI paraphrasing or a promise of viral results.

With both server variables configured, an authenticated Telegram account can request real generation. Input is sent to OpenAI with `store: false`, strict JSON Schema, output validation, a 45-second timeout and no client-exposed key. Invalid/refused/truncated/upstream-error results are rejected; no silent mock substitute. Per-instance limits: 12 generation requests/minute/address, 20/hour/account. A platform limiter is recommended for a scaled deployment.

## Persistence and publication

Apply `scripts/teacher/posts-schema.sql` explicitly to the server PostgreSQL database before publishing. This PR does not apply production migrations. New `teacher_post_authors` and `teacher_posts` tables are exported for Drizzle tooling; SQL is additive. Neither existing teacher lessons nor account/payment/progress tables are modified. The author module uses verified Telegram identity as an external identity, without a student-table FK.

`POST /api/teacher/posts/publish` accepts validated draft/post. Server derives the author from the signed cookie/database account, ignores any client-provided teacher ID/username/CTA, recomputes CTA, saves in one transaction, and returns the public path. Unique UUID slug, published status, FK ownership, no private Telegram/email fields in public read responses. No editing endpoint or public list is exposed in this slice. Public page is noindex/follow and not in sitemap; no SEO promotion until reviewed. A publishing request intentionally creates a new immutable snapshot.

Draft autosave is device-local, keyed by Telegram ID or guest. Only content/mode is restored; account-sensitive CTA is recomputed during generation/publication. Logout/account changes discard stale requests and load that account's draft. No content is saved to the course progress key. Failed publication leaves export available.

## CTA policy

- Server-verified Telegram username `KristinaPerez9` (case insensitive): `Продолжить в EspanolReal` → configured site `/learn`.
- Others: optional CTA enabled by default. The entered general lesson URL is remembered in the draft and used as `Уроки преподавателя`; no URL means no invented link.
- Specific URL takes priority and uses `Продолжить урок «<название>»` (name optional).
- Disabling the optional CTA removes it for other accounts. No automatic EspanolReal promotion for other teachers.

## Social export

All eight requested buttons are present: Telegram, Instagram, Threads, Facebook, Max, VK, WhatsApp and Pinterest. Telegram uses its official URL share flow once a published URL exists. WhatsApp uses its click-to-chat text flow. All other destinations use the device's Web Share chooser when available, otherwise copy the complete post with instructions to paste it in the selected service. These buttons do not promise platform-specific autofill, image upload, or API publishing. The chooser cannot force a specific app. Pinterest/Instagram image creation is not part of text export. Clipboard-denied fallback provides a selectable textarea; cancelling native share does not silently copy/send.

Official references checked during implementation:
- https://core.telegram.org/widgets/share
- https://faq.whatsapp.com/5913398998672934
- https://developers.openai.com/api/docs/guides/structured-outputs

Automated evidence: [TEACHER_POSTS_QA.md](TEACHER_POSTS_QA.md).

## Deploy/acceptance checklist

1. Open the PR's Netlify preview, then `/teacher/posts/new`.
2. Enter a real note (20–8000 chars) and generate directly; guests get the labelled mock without an extra unlock click. Try disabling the lesson-link checkbox: its fields are disabled and their URLs do not block generation. Edit title/quiz and copy the text.
3. Check mobile navigation in RU/FR, stacked panels, and widths 320/390/768/1280.
4. Configure verified Telegram login on the preview domain (issue #1 is a pre-existing auth issue), server DB and the additive post migration for publication. Check another teacher and KristinaPerez9 for their CTA policies.
5. Configure an approved AI model/key and verify real generated content. Review language accuracy before posting.
6. Publish, open the returned public URL in a separate browser, answer the quiz and copy/share. Confirm no course XP/SRS changes.

Server APIs require the Next/Netlify server build. Static export preserves student functionality and renders the studio shell but cannot perform server generation/publication/login. Live Telegram login, real paid AI calls, production DB and Safari/PWA require deployment/device acceptance and are not claimed by local automated tests.
