# Phase 1 QA — 2026-10-04

Baseline main: `e3e4d905a6dd2ac982fdbdee54a157af26bb29f1`. No production deployment, migration or merge performed.

| Check | Result / limit |
| --- | --- |
| Baseline TypeScript + security suite before changes | Passed |
| Changed code TypeScript and production server build | Passed |
| Static/offline export (`scripts/build-static.mjs`) | Passed; existing API folder restored by script |
| Existing security regression suite | All checks passed after changes |
| Teacher URL safety + answer grading | Passed, including unsafe schemes, lookalike hosts, credentials, custom ports and text normalization |
| ESLint on new Teacher files and changed AppShell/landing | Passed |
| Whole-project ESLint | Fails on existing untouched files: 15 errors, 4 warnings (auth, provider effects, payment memoization, confetti purity). Not fixed in this scoped PR. |
| PostgreSQL-compatible schema/seed in isolated PGlite | Passed; enums/tables created; duplicate seed harmless; unique slug enforced; foreign key rejects missing owner; new lessons default to draft/pending |
| Chromium desktop, 1280 px | Passed against production build |
| Chromium mobile, 360 px | Passed; signed-in session response simulated, not a real Telegram login |
| Browser interaction | Wrong/correct choice, text input/Enter, feedback, score 2/3 and retry 3/3 passed |
| Course progress isolation | Exact course localStorage string unchanged after Teacher practice/completion and reload |
| Funnel events | View/start, 3 answers, complete/score, attribution/profile, booking and social click verified; booking provider and UTM/visitor fields checked |
| Public HTML / SEO | No teacher email leak; self canonical; noindex/follow; demo absent from sitemap; robots does not block practice |
| Routing | Public direct lesson/profile, back, refresh, directory and unknown-slug 404 passed; /lesson/1 and /lesson/8 return 200 |
| Visual/mobile | Full-page 360 px screenshot inspected; no horizontal overflow |
| Browser console | No page errors. Next.js logs internal NoFallbackError for unknown-slug probes while correctly returning 404. |
| Contact configuration | Both configured-contact and unset-contact production builds passed browser checks. Configured test used safe placeholder destinations with all outbound requests blocked; no real booking/message was made |
| Safari/WebKit and real Android/iPhone installed PWA | Not run: WebKit binary unavailable; device QA required |
| Existing Telegram auth, actual payment, support delivery, live DB | Not exercised; source files unchanged and existing security suite passes, but integration QA remains required |
| Reliable leads metric | Collector/confirmed-booking integration not configured; adapter events only |

Teacher authentication, ownership mutations, AI output validation, dashboard and publication/index approval flows intentionally remain Phase 2. This slice has no user-write endpoint to authorize.
