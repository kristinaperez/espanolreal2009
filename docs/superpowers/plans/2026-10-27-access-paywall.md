# Access, Trial and Paywall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1490 ⭐ per calendar month, Telegram login before lesson 1, trial = first lesson or 7 days from registration, paywall with rotating price comparisons measured per variant, and a friendly start card with the Zaragoza lion.

**Architecture:** Builds on PR #27 in `main`. Pure policy in `src/lib/payments/*` (unit-checked in Node via the existing `vm`+`typescript` loader pattern), thin route changes in `src/app/api/*`, one additive SQL column, UI changes confined to the paywall component, landing pricing block and a new start card in the trainer.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Drizzle/PostgreSQL, Telegram Stars.

**Spec:** `docs/superpowers/specs/2026-10-27-access-paywall-design.md`

## Global Constraints

- Price: `1490` Stars; caption exactly `≈ 32 € в месяц · около 1 € в день`.
- Period: calendar month from `orders.paid_at` (UTC); day overflow clamps to month end (31.01 → 28/29.02).
- Legacy `premium-45` stays lifetime.
- Trial: ends after first completed lesson or 7 days, whichever first; starts at first Telegram login.
- No checkout buttons on the homepage.
- Comparisons and motivations live in `data/course.config.json` (`payments.comparisons`, `payments.priceHint`, `motivations`).
- Analytics only after consent (`localStorage["espanolreal:analytics-consent:v1"] === "accepted"`); Metrika counter `113580037`; webvisor stays off.
- Migrations additive only. No production migration, webhook or deploy from this plan.
- No real people's images; motivations without names/ages.
- Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_015zoKUfmzTXzBHmLdkcUNh9`.

## Review Focus

1. Payment on 31 Jan / 29 Feb / 31 Dec — expiry must clamp, never skip a month. (Task 1 tests.)
2. Two paid orders while one is active — second month starts at the end of the first. (Task 1 test.)
3. Forged or unknown `variant` in the invoice request — stored as `null`, invoice still created. (Task 4 test.)
4. Anonymous visitor opening `/lesson/1` — sees the start card, never a spinner or error. (Task 6 test.)
5. User who registered before deploy — trial starts on first login after deploy, not already expired. (Task 3 test.)

---

### Task 1: Price 1490 and calendar-month expiry

**Files:**
- Modify: `src/lib/payments/catalog.ts` (`DEFAULT_STARS_PRICE`, remove `ACCESS_PERIOD_MS` export usage, product description)
- Modify: `src/lib/payments/access.ts`
- Modify: `data/course.config.json` (`payments.starsPrice`)
- Test: `scripts/access-blog-checks.mjs`

**Interfaces:**
- Produces: `addCalendarMonth(date: Date): Date`, `licenseIsActive(productId: string, paidAt: Date | null, now?: number): boolean`, `monthlyExpiry(payments: {productId: string; paidAt: Date | null}[]): Date | null` (all in `access.ts`); `starsPrice(): number` returns 1490.

- [ ] **Step 1: Update tests** — in `access-blog-checks.mjs` replace `1790` with `1490`, replace every `ACCESS_PERIOD_MS` arithmetic with `addCalendarMonth`, and add:

```js
const m = d => policy.addCalendarMonth(new Date(d)).toISOString();
assert.equal(m('2026-11-15T10:00:00Z'), '2026-12-15T10:00:00.000Z');
assert.equal(m('2027-01-31T10:00:00Z'), '2027-02-28T10:00:00.000Z');
assert.equal(m('2028-01-31T10:00:00Z'), '2028-02-29T10:00:00.000Z');
assert.equal(m('2026-12-31T10:00:00Z'), '2027-01-31T10:00:00.000Z');
const jan31 = new Date('2027-01-31T00:00:00Z');
assert(policy.licenseIsActive('premium-monthly', jan31, Date.parse('2027-02-28T00:00:00Z') - 1));
assert(!policy.licenseIsActive('premium-monthly', jan31, Date.parse('2027-02-28T00:00:00Z')));
assert.equal(policy.monthlyExpiry([{productId:'premium-monthly',paidAt:jan31},{productId:'premium-monthly',paidAt:jan31}]).toISOString(), '2027-03-28T00:00:00.000Z');
```

- [ ] **Step 2: Run** `node scripts/access-blog-checks.mjs` — Expected: FAIL (`addCalendarMonth is not a function` / 1790 ≠ 1490).
- [ ] **Step 3: Implement** — `addCalendarMonth` via UTC fields: target month = month+1, day = min(day, last day of target month), keep time. Stacking: `end = addCalendarMonth(new Date(max(end, paidAt)))`. Set price 1490 in catalog and config; description: `Все уроки курса, полная система повторения, экзамены и сертификат. Доступ на календарный месяц за 1490 Stars. Продление вручную, без автосписаний.`
- [ ] **Step 4: Run** the script — Expected: first PASS lines print; later sections may fail only on 1790 (fixed in Task 4).
- [ ] **Step 5: Commit** `feat: 1490 Stars per calendar month`.

### Task 2: One source for price copy

**Files:**
- Modify: `data/course.config.json` (`pricing.premium.*`, FAQ answers, add `payments.priceHint`), `src/lib/seo/public-faq.ts`, `src/app/(main)/terms/page.tsx`, `public/llms.txt`, `src/components/payments/telegram-stars.tsx` (texts only), `src/components/trainer/session-summary.tsx`, `src/components/learn/settings-view.tsx`, `src/components/providers/auth-provider.tsx` (`FALLBACK_STARS`), `src/components/landing/landing-page.tsx` (RU/FR strings incl. stale «уроков бесплатно · без регистрации», «Первые уроки», «Без регистрации»), `src/app/api/lessons/[n]/route.ts` (402 text), `src/app/api/payments/telegram/stars/route.ts` (comment).
- Create: `scripts/paywall-checks.mjs` (new test file, grows in later tasks)

**Interfaces:** Produces `courseConfig.payments.priceHint: string` = `≈ 32 € в месяц · около 1 € в день`.

- [ ] **Step 1: Test** — `paywall-checks.mjs` scans `src/`, `data/`, `public/llms.txt` and asserts no match for `/1790/` and none for `/30 дней|30 days|30 jours|30 يومًا/` except the achievement strings `30 дней подряд` / `Заниматься 30 дней подряд`; asserts config `payments.starsPrice === 1490` and `payments.priceHint` equals the constant; asserts landing source has no `без регистрации`.
- [ ] **Step 2: Run** `node scripts/paywall-checks.mjs` — Expected: FAIL listing files.
- [ ] **Step 3: Replace copy** — use `{starsPrice}`/`payments.starsPrice` instead of literals; period wording «за месяц» / «доступ на календарный месяц»; FR «pour un mois»; AR «لمدة شهر» (flag for language review in PR). Landing: «Начните бесплатно: войдите через Telegram — первый урок или 7 дней, что наступит раньше.»
- [ ] **Step 4: Run** the script — Expected: PASS.
- [ ] **Step 5: Commit** `chore: price copy from a single source`.

### Task 3: Login required; trial starts at registration

**Files:**
- Modify: `src/app/api/lessons/[n]/route.ts`, `src/app/api/telegram/auth/route.ts` (POST and GET redirect flavour)
- Test: `scripts/access-blog-checks.mjs` (lesson-route section), `scripts/paywall-checks.mjs`

**Interfaces:**
- Consumes: `resolveTrial(request, userId?, start?)` from `src/server/trial.ts` (unchanged).
- Produces: `GET /api/lessons/:n` → `401 { error: "Войдите через Telegram, чтобы начать бесплатный урок." }` when no session and no license.

- [ ] **Step 1: Tests** — in the lesson-route section: `user=null` → `getLesson(1)` status `401`; existing guest assertions move under a logged-in `user={id:1,telegramId:42}` with `activeLicense=null`. In `paywall-checks.mjs`, load the auth route with mocks (`verifyTelegramLogin` ok, `upsertTelegramUser` → `{id:7,telegramId:99}`, spy `resolveTrial`) and assert `resolveTrial` called once with `(request, 7, true)` and response status 200; a failing `resolveTrial` must not fail login (still 200).
- [ ] **Step 2: Run** both scripts — Expected: FAIL.
- [ ] **Step 3: Implement** — lessons route: if `!user && !license` return 401 before `resolveTrial`; call `resolveTrial(request, user.id, n === 1)`. Auth route: after upsert, `await resolveTrial(request, user.id, true).catch(() => null)` and `setTrialCookie` not needed (account trial).
- [ ] **Step 4: Run** both — Expected: PASS for these sections.
- [ ] **Step 5: Commit** `feat: require Telegram login before the first lesson`.

### Task 4: Price comparisons, variant on orders

**Files:**
- Create: `src/lib/payments/comparisons.ts`, `docs/migrations/20261027-price-variant.sql`
- Modify: `data/course.config.json` (`payments.comparisons`, 8 items from spec table, ids `coffee, supermarket, menu, group, cafe, netflix, gym, tutor`), `src/db/schema.ts` (`priceVariant: text("price_variant")`), `src/server/orders.ts` (`createPendingOrder(userId, product, priceVariant: string | null = null)`), `src/app/api/payments/telegram/stars/route.ts`
- Test: `scripts/paywall-checks.mjs`, `scripts/access-blog-checks.mjs` (invoice section: 1490)

**Interfaces:**
- Produces: `type PriceComparison = { id: string; text: string; source?: string }`; `comparisons(): PriceComparison[]`; `comparisonFor(seed: number | string): PriceComparison` (stable FNV-1a hash of `String(seed)` mod length); `knownVariant(id: unknown): string | null`.

- [ ] **Step 1: Tests** — `comparisons().length === 8`; ids unique; `comparisonFor(42).id === comparisonFor(42).id`; seeds 1..200 hit ≥ 6 distinct ids; `knownVariant('menu') === 'menu'`, `knownVariant('x') === null`, `knownVariant({}) === null`. Invoice route: body `{productId:'premium-monthly', variant:'menu'}` → `createPendingOrder` spy receives `'menu'`; `variant:'<script>'` → receives `null`, status 200; invoice stars `1490`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement**; SQL: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS price_variant text;` plus a commented report query grouping paid orders by `price_variant`.
- [ ] **Step 4: Run** both scripts, `npm run typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: price comparisons with per-order variant`.

### Task 5: Paywall UI and measurement

**Files:**
- Create: `src/lib/analytics/paywall.ts`
- Modify: `src/components/payments/telegram-stars.tsx`, `src/components/landing/landing-page.tsx` (pricing block)
- Test: `scripts/paywall-checks.mjs`

**Interfaces:**
- Consumes: `comparisonFor`, `courseConfig.payments.priceHint`.
- Produces: `trackPaywall(event: "paywall_view" | "checkout_click", variant: string): void` — no-op without consent; calls `window.gtag?.("event", event, { variant })` and `window.ym?.(113580037, "reachGoal", event, { variant })`; never throws.

- [ ] **Step 1: Tests** — `trackPaywall` with fake `window`/`localStorage`: no calls without consent; with consent both called with `{variant:'menu'}`; throwing `gtag` does not throw.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** — paywall (state after trial, user signed in, not premium): line `{starsPrice} ⭐ · {priceHint}` and comparison text; variant = `comparisonFor(user.telegramId)`; `paywall_view` once per mount; `checkout_click` before the invoice fetch; send `variant: comparison.id` in the POST body. Landing pricing: price + hint + comparison for a guest seed stored in `localStorage["espanolreal:price-variant:v1"]` (try/catch; fallback random), no button.
- [ ] **Step 4: Run** script + `npm run lint` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: paywall with price comparison and variant analytics`.

### Task 6: Start card with the lion

**Files:**
- Create: `public/mascot/lion.png` (bubble removed, 209×217, transparent), `src/components/trainer/start-lesson-card.tsx`
- Modify: `data/course.config.json` (`motivations`: 22 strings from spec), `src/components/trainer/trainer-page.tsx`
- Test: `scripts/paywall-checks.mjs`

**Interfaces:**
- Produces: `StartLessonCard({ lesson }: { lesson: Lesson })` — lion image (`alt="Львёнок EspañolReal"`, width 140), HTML bubble `¡Vamos! Пойдём!`, title + up to 2 phrases from `lesson.phrases` (already the public teaser) with a speak button (`speechSynthesis`, `lang="es-ES"`, hidden if unsupported), vertical ticker of `motivations` (CSS keyframes, list duplicated with `aria-hidden` copy, `motion-reduce:animate-none`, pause on hover/focus-within), `<TelegramLogin />`, heading «Первый урок бесплатно».
- Trainer: when `protectedContent && auth status === "server" && !user && accessLesson === 1`, render `StartLessonCard` instead of fetching; a 401 from `/api/lessons/1` also switches to it.

- [ ] **Step 1: Tests** — render with `renderToStaticMarkup` (mock `TelegramLogin`): contains «Первый урок бесплатно», `/mascot/lion.png`, both teaser phrases, at least 22 `<li>` in the ticker, no third phrase when given 3; config motivations contain no digits followed by «лет»/«год».
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** with existing tokens (`bg-surface`, `border-line`, `text-muted`, `primary`) and `Card`/`Button`.
- [ ] **Step 4: Run** script, `npm run typecheck`, `npm run lint` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: start card with mascot, lesson preview and motivations`.

### Task 7: Docs, full verification, review

**Files:**
- Modify: `docs/ACCESS_BLOG.md` (new section 2026-10-27: price, calendar month, login, variants, migration order), `CHANGELOG.md`, `package.json` (`"test:paywall": "node scripts/paywall-checks.mjs"`)

- [ ] **Step 1:** Run `npm ci` (if needed), `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:security`, `node scripts/access-blog-checks.mjs`, `npm run test:paywall`, `node scripts/build-static.mjs` — Expected: all exit 0; record real output.
- [ ] **Step 2:** Visual check: production build, Playwright screenshots of `/lesson/1` (anonymous, 390px, light + dark) and landing `#pricing`.
- [ ] **Step 3:** Dispatch an independent reviewer agent over the branch diff vs `origin/main`; fix blocking findings.
- [ ] **Step 4:** Commit docs, push, open PR to `main` (no merge, no deploy).
