# WOW posts QA — 2026-10-04

Source: `feature/responsive-wow-posts`, based on open PR4/fa49ba8c. Local production build, Chromium automation and isolated PGlite database; no production mutation.

| Check | Result |
| --- | --- |
| TypeScript strict check; lint changed application files | Passed |
| Next production build and static export | Passed |
| Existing security regression suite | Passed |
| Existing Phase1 pure URL/quiz checks | Passed |
| Existing Phase1 desktop/mobile quiz, retry, profile, noindex and unchanged course storage | Passed in Chromium; simulated session, contacts absent |
| Draft/post validation, unsafe links, duplicate choices, invalid answer indexes | Passed |
| Server account CTA rules: KristinaPerez9, other teachers, opt-out, general/specific links | Passed |
| Publication ignores forged author ID/username/CTA | Passed with isolated route dependencies |
| Paid AI auth gate; explicit guest mock never calls paid provider | Passed with isolated route dependencies |
| Strict AI request contract, refusal/partial output rejection | Passed with stubbed provider responses; no real AI call |
| Drizzle/PGlite publish → public read; author reuse, unique slug, private-field exclusion, FK, rollback | Passed |
| Landing and studio widths 320, 360, 390, 768, 1024, 1280, 1440 | Passed in Chromium; no horizontal overflow |
| Student dashboard/lessons/map/stats/settings widths 320 and 390 | Passed in Chromium after calendar/cards layout fix |
| Mobile menu open/close; input, real server mock generation, mini-quiz wrong/correct, inline edit | Passed |
| Copy text/link; Instagram copy fallback; autosave/restore; loader/error preserves source | Passed |
| Logged-in publish/public-read UI and account draft isolation | Passed with simulated session and publication/read responses |
| Real local API rejects unauthenticated publish, foreign Origin, invalid draft, invalid public slug | Passed |
| Exact course localStorage before/after generation, quiz and public-post UI | Unchanged |
| Mobile screenshot visual inspection | Passed (system font fallback, external resources blocked) |

## Reproduction

- `npm run typecheck`
- `npx eslint` for files changed by this PR
- `npm run build`
- `node scripts/build-static.mjs` (then rebuild server for API QA)
- `npm run test:security`
- `node scripts/teacher-phase1-checks.mjs`
- `node scripts/teacher-post-checks.mjs`
- With Playwright/Chromium available: start production server, run `node scripts/e2e-teacher-posts.cjs <baseURL>`. Server/test must share the same network namespace. Optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` and JSON `PLAYWRIGHT_CHROMIUM_ARGS` support externally provided browser binaries.
- Optional DB integration: install `@electric-sql/pglite` in an isolated QA workspace; run `node scripts/teacher-post-db-checks.mjs`. If installed outside this project, set `NODE_PATH` to that workspace's node_modules and `PGLITE_MODULE` to its ESM entry. No project dependency changes are required.

## Limits

Real Telegram OAuth/domain setup, real AI language quality, production PostgreSQL and Safari/iPhone/PWA were not tested. Server secrets/model and post migration are required to enable real AI/publishing. In this session, test mode is usable with the mock; public API persistence was checked against PGlite through the actual repository and publication UI used controlled responses. Do not interpret a successful mocked UI flow as a deployed database migration or verified Telegram login.

Full-project lint has known pre-existing failures in auth/providers/payment/confetti (see Phase1 QA); changed files pass. Platform social app behavior was not tested on real devices. Buttons use verified Telegram/WhatsApp sharing flows and native share/copy fallback for other platforms, without automatic sending. Static export has no server APIs.
