# Access and blog — 2026-10-20

## User behavior

- Free trial begins when the first course lesson is loaded. It ends after completing that lesson or exactly seven days later, whichever comes first. Lessons 2+ need Premium.
- No checkout links on the homepage. Plain tariff information remains visible. The lesson summary offers checkout when the trial ends; settings and locks follow the same rule.
- New SKU `premium-monthly`: 1790 Stars for **30 days**, manual renewal, no recurring Telegram debit. Legacy `premium-45` paid purchases retain lifetime terms. Payment expiry uses `orders.paid_at`, not webhook replay or license activation time.
- Multiple successfully paid pending invoices add their periods instead of losing paid days. New invoices are blocked while Premium is already active. Refunded orders are excluded when deriving entitlement.
- Public lesson URLs still show their descriptions and two teaser phrases. Full exercises, including lesson 1, require server authorization. Search/review phrase banks no longer embed full free lessons in static HTML.
- Public blog `/blog`; articles `/blog/{slug}`. Two editable starter articles are included in the migration. Only published articles enter the public pages and sitemap. Unknown/draft URLs return 404.
- `/admin/blog`: Telegram login, create, edit, draft, preview, publish and unpublish. Slugs remain stable after creation. Paragraphs and `##`/`###` headings are supported; arbitrary HTML is escaped. Article creation does not require a site rebuild.

## Deployment order

1. Back up the production database. Apply `docs/migrations/20261020-blog-trials.sql` to the **same PostgreSQL database** used by `DATABASE_URL`. This adds `learning_trials` and `blog_articles`; it does not rewrite historical purchases. Its starter inserts do not overwrite existing articles.
2. Set server-only `BLOG_ADMIN_TELEGRAM_IDS` to the owner's confirmed Telegram ID (comma-separated IDs if needed). `/admin/blog` displays the currently signed-in ID when access has not yet been granted. Do not use a username or browser-supplied ID for authorization.
3. Ensure `DATABASE_URL`, independent 32+ byte `SESSION_SECRET`, existing Telegram bot and webhook secrets are configured. The previous `TELEGRAM_STARS_PRICE` / `NEXT_PUBLIC_STARS_PRICE` override is intentionally ignored by the new fixed-price SKU.
4. Deploy the PR preview. Test first-lesson completion, seven-day expiry using a disposable test record, login, real Telegram Stars payment and restore, admin save and public blog URLs.
5. Merge/deploy only after configured-database and real Telegram acceptance. This workspace has no production database or deployment settings access.

Owner workflow after deployment: open `/admin/blog`, sign in, click **Новая статья**, enter title/URL/description/text, preview, then save as a draft or tick **Опубликовать на сайте** and save. Unticking the same box and saving removes the article from public pages and sitemap. Authorized accounts also see **Статьи** in the header.

## Verification and limits

`node scripts/access-blog-checks.mjs`: executed policy and API handler checks with mocked storage, including exact trial/payment boundaries, cookie tampering, CSRF, forged admin, create/edit/publish/unpublish, duplicate slugs and HTML escaping.

`npm run test:security`, `npm run lint`, `npm run typecheck`, `npm run build`, `node scripts/build-static.mjs`: passed. The production build was rebuilt after restoring offline-only routes.

Real local HTTP checks passed: homepage/blog 200, unknown article 404, anonymous admin API 401, nontrial lesson API 402, lesson 1 HTML omits non-teaser exercise content. No live database was connected.

`node scripts/access-blog-browser.cjs`: prepared for Chromium. Browser API fixtures are mocked; it is not a live PostgreSQL/Telegram acceptance test. The sandbox could not install the Chromium binary, so this check is **not reported as passed**.

`node scripts/e2e-telegram-stars.mjs`: adapted to the new tariff/trial; requires a clean configured test PostgreSQL database and mock Telegram Bot API. Not executed against production.

Anonymous trial identity is a signed HttpOnly cookie backed by a database row. Clearing all cookies or changing browsers can create a new anonymous trial. An authenticated account keeps its server trial across devices. Strict person-level trial enforcement would require login before the first lesson; that behavior is not introduced here.

Existing isolated Arabic demo lessons and `/ru/world` remain separate demos. The new gate applies to the main 45-lesson course. Static offline exports remain intentionally unprotected and must not be used for commercial hosting. Dynamic blog/admin are server-only.

## Change record

CHANGE: trial/paywall timing, monthly SKU, hidden homepage checkout/teacher link, persistent blog and editor.
WHY: let learners experience the first lesson before paying, offer a clear monthly term and let the owner publish without code edits.
FILES: payment catalogue/access policy, server trial/billing/account handlers, main trainer/landing/navigation, new blog/admin pages and APIs, schema and additive SQL migration.
RISK: migration/environment must precede deployment; guest trial reset limitation; live Telegram/payment acceptance still required.
TEST: policy/handler execution with mocks, static security regression, lint/types/build and real local HTTP checks. Browser/manual/live-database checks distinguished above.
RESULT: implementation prepared on feat/monthly-access-blog-20261020. The owner explicitly authorized publishing the changes to kristinaperez/espanolreal2009 and opening a PR on 2026-10-20. Production deployment still requires the migration, server configuration and acceptance checks described above.
