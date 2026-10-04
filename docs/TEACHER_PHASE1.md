# Teacher Interactive Lesson — Phase 1

## Scope and boundaries

This PR implements the first vertical slice only. Teacher/TeacherLesson are independent of the course Lesson, student progress, Telegram identity and billing. The public slice uses a server-only hardcoded fixture repository. Drizzle entities and additive SQL are ready for a later DB-backed repository; this PR does not connect the public fixture to production persistence and applies no production migration.

Routes:
- `/teachers`: minimal demo discovery entry (not a marketplace/search directory).
- `/teachers/demo-teacher`: fictional teacher profile.
- `/practice/demo-pedir-en-un-cafe`: explanation, examples, choice/text questions, feedback and result.

All demo pages are `noindex, follow`, self-canonical and absent from sitemap. Publication and index approval are separate fields; Phase 1 never grants indexing. Unknown slugs return 404. No teacher dashboard, account creation, write API or AI endpoint is exposed. Existing student providers still hydrate globally, but Teacher practice does not consume or dispatch course events.

## Schema and checkpoint

Base HEAD: `e3e4d905a6dd2ac982fdbdee54a157af26bb29f1`; feature branch: `feature/teacher-lessons-phase-1`.

`src/db/teacher-schema.ts` is re-exported from the existing schema. The tables use an ownership foreign key, unique email/slug, status enums and JSONB block/question arrays. No existing billing table definitions are changed.

For a separate staging database, back up the database and review `scripts/teacher/phase1-schema.sql` before applying it once. The SQL was generated from the isolated Teacher schema, so it does not contain alterations to existing tables. `scripts/teacher/seed-demo.sql` adds an optional fictional teacher and does not overwrite existing rows. Do not apply both this SQL and a separate Drizzle migration that creates the same objects. No migrations/seeds run during build or request handling. Public pages remain fixture-backed even after this optional seed; DB-backed reads/writes belong to Phase 2.

## Booking and socials

The test teacher is explicitly fictional. No invented contact is presented as a real booking destination. To test links, set server-side variables **before building**, then rebuild:

- `TEACHER_DEMO_CALENDLY_URL`: your actual HTTPS Calendly event URL.
- `TEACHER_DEMO_TELEGRAM_URL`: HTTPS `t.me` profile URL.
- `TEACHER_DEMO_WHATSAPP_URL`: HTTPS `wa.me` or `api.whatsapp.com` URL.
- `TEACHER_DEMO_VK_URL`: HTTPS `vk.com` profile URL.

Unset/invalid fields are hidden. Links reject credentials, custom ports, control characters, javascript/http schemes and lookalike hosts. Booking CTA appears on the profile and after practice completion, not inside questions. Email is explicitly excluded from public props. Content uses React text nodes, never HTML rendering. The displayed rate is marked as a demonstration.

## Analytics contract and measurement limit

`trackTeacherEvent` sends a browser CustomEvent `espanolreal:teacher-analytics` with `{event, properties}`. A consent-aware integration can register `setTeacherAnalyticsAdapter` to forward it to a collector. Adapter failures never block practice or navigation. No vendor SDK, collector or persistent analytics backend is added; **events alone do not yet produce a reliable leads dashboard**.

Emitted now: lesson view/start, question answered, lesson complete, author click, profile view, booking click, social click. Payload includes session visitor id, teacher/lesson identity, topic/level/seo status, source page, referrer without query/fragment and current URL UTM fields. No raw student answers, teacher email or credentials are sent. Campaign values are local to the current URL; attribution persistence across navigation is a later collector decision.

The event union reserves share/supply funnel and booking-scheduled events, but those are not emitted without the corresponding Phase 2/3 flows. Booking clicks carry `booking_provider=calendly`, lesson id on lesson pages and null on profile pages. A click is intent, not a confirmed appointment. Primary metric once a collector exists: booking clicks / published TeacherLessons; analyze indexed traffic separately. Calendly confirmation/embed is deferred.

## Verification commands

```sh
npm ci
npm run typecheck
npm run build
npm run test:security
node scripts/teacher-phase1-checks.mjs
npx eslint src/components/teacher src/lib/teacher src/server/teacher src/db/teacher-schema.ts src/app/teachers src/app/practice
npm run start -- -H 127.0.0.1 -p 3100
```

Browser regression runner: `node scripts/e2e-teacher-phase1.cjs http://127.0.0.1:3100`. Playwright plus Chromium/WebKit must be available to the QA environment. Set `TEST_TEACHER_CONTACTS=true` only when all four demo contacts are configured at build time. The runner blocks third-party scripts and service workers to isolate this slice. It checks wrong/correct responses, text normalization, completion, retry, unchanged course localStorage, events, metadata, contact targets, profile/back/refresh/direct URLs, 404, sitemap/robots, mobile overflow and legacy numbered lesson responses. Signed-in coverage uses a simulated session response; it is not a production authentication test. Real Safari, Android, installed PWA, external booking completion, production DB and real authenticated Telegram require staging/device QA.

## Deferred phases

Phase 2 starts after runtime QA acceptance: email authentication/account ownership, teacher cabinet, DB-backed My Lessons, validated server AI output, preview/edit/draft/publish, manual SEO review and similarity extension, approved-only sitemap. Phase 3 adds sharing tools and teacher analytics after a real collector and usage data. Phase 4 marketplace, scheduling, payments/CRM are not included.
