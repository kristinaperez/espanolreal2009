# ESPANOLREAL PROJECT AUDIT

Baseline: `e3e4d905a6dd2ac982fdbdee54a157af26bb29f1` (main), reviewed 2026-10-04. Open issues: #1 Telegram login. Open PRs #2/#3 are documentation-only access tests. No AGENTS.md or existing Teacher implementation found in the recursive repository tree.

## Architecture and responsibilities

- Next.js App Router, React 19, TypeScript, Tailwind v4; package.json provides build, typecheck, lint, security regression and support webhook checks.
- `data/lessons/lesson001…045.json` and `data/course.config.json`: phrases, examples, translations, course settings and navigation. `src/lib/content/loader.ts`: build/server loader. `src/lib/content/french-demo.ts`: French demo localization; LanguageProvider switches RU/FR.
- `src/components/trainer/*` and exercise generator: study/practice/result. ExerciseRunner and TrainerPage use ProgressProvider and dispatch course learning events, so they cannot safely serve TeacherLesson unchanged.
- `src/lib/progress/*`, `src/lib/srs.ts`, ProgressProvider: localStorage progress, mistakes, XP, achievements and SRS. RootLayout mounts student providers globally; public Teacher components can avoid consuming or dispatching to them, but the existing provider may still hydrate/save the unchanged course state.
- `src/lib/telegram/*`, `src/lib/session.ts`, auth routes and AuthProvider: server HMAC validation for Login Widget/initData, signed HttpOnly session and client session restoration. Teacher email authentication does not exist.
- `src/db/schema.ts`, `src/server/orders.ts`, payment/webhook routes: PostgreSQL with Drizzle, Telegram users, orders and licenses. Premium depends on a paid order. Restore is tied to verified Telegram identity. Teacher content must be a separate model.
- `src/lib/content/secure.ts` and lesson APIs: server premium gate with public teaser; static export deliberately disables paid-content protection.
- `src/app/manifest.ts`, `public/sw.js`, PwaRegister: install metadata and network-first page caching/static asset cache. Netlify configuration supplies build settings/security headers. Service worker excludes API requests.
- `src/app/layout.tsx`, robots/sitemap and lesson metadata: SEO and structured data. Sitemap is static and currently contains only course routes. robots allows crawling outside API.

## User flow and code-confirmed behavior

Landing → /learn or numbered lesson → intro → practice → result → course progress/repetition. Telegram sign-in → Stars invoice → payment webhook → paid order/license → account Premium. Separate support bot routes exist. These paths and checks are present in code; production Telegram login, actual payment, support delivery and offline installation were not exercised during this audit. Issue #1 remains unresolved by this work.

## Confirmed risks and verification limits

- Reusing the current ExerciseRunner would send Teacher answers to course progress. Phase 1 will reuse Button/Card styling with a separate local-state runner.
- Root metadata is indexable with home canonical; new public Teacher routes must override both. New lessons must stay noindex and out of sitemap.
- No Teacher ownership/auth layer exists; Phase 1 exposes no edit/write API. Phase 2 must validate authenticated ownership server-side.
- A database URL is required for real persistence. Do not run schema changes automatically on production. Separate reviewed additive SQL/checkpoint required.
- Root auth/progress providers and global scripts are inherited by all routes. Their runtime and external integrations require regression QA; do not rewrite the root or AppShell in this slice.
- Service worker caches pages; future draft/private teacher dashboards will need a private-cache policy before Phase 2.
- Device QA (iPhone/Android installed PWA, Safari), real production credentials/DB and reliable booking confirmation are separate checks. No claim of working production functionality is inferred solely from README.

## Phase 1 implementation plan

Add independent Teacher/TeacherLesson types, Drizzle tables, reviewed SQL and server-only demo fixture. Render /teachers, /teachers/[teacherSlug], /practice/[lessonSlug] outside student AppShell. Use separate practice state, safe text rendering, validated external URLs, explicit demo attribution, pending/noindex metadata, vendor-independent events. Append navigation entry without reordering existing items. Keep auth, payments, numbered lessons, progress, sitemap, manifest and service worker unchanged. Defer dashboard, AI, publication/indexing workflow and marketplace to their specified phases.
