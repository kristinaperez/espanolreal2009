import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PRICE_HINT = '≈ 32 € в месяц · около 1 € в день';
const config = JSON.parse(fs.readFileSync('data/course.config.json', 'utf8'));

// --- Task 2: one source for price copy -------------------------------------
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|json|txt|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}
// session.ts: the 30-day cookie lifetime is unrelated to the price.
const files = [...walk('src'), ...walk('data'), 'public/llms.txt'].filter(f => f !== path.join('src', 'lib', 'session.ts'));
const ALLOWED_30 = /30 дней подряд|Заниматься 30 дней подряд/g;
const stale = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (/1790/.test(text)) stale.push(`${file}: 1790`);
  if (/30 дней|30 days|30 jours|30 يومًا|لمدة 30/.test(text.replace(ALLOWED_30, ''))) stale.push(`${file}: 30-day wording`);
}
assert.deepEqual(stale, [], `Stale price copy:\n${stale.join('\n')}`);
assert.equal(config.payments.starsPrice, 1490);
assert.equal(config.payments.priceHint, PRICE_HINT);
assert(!/без регистрации/i.test(fs.readFileSync('src/components/landing/landing-page.tsx', 'utf8')), 'landing still promises no registration');
console.log('PASS: no 1790 / 30-day copy left, price 1490 and price hint come from config, landing no longer promises "no registration".');

// --- Task 3: login required; trial starts at registration ------------------
import vm from 'node:vm';
import ts from 'typescript';
export function load(file, aliases = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText,
    { exports, process, Buffer, Date, console, URL, URLSearchParams, setTimeout, require: name => { if (!(name in aliases)) throw Error(`Unexpected import ${name}`); return aliases[name]; } });
  return exports;
}
const trialCalls = [];
let trialFails = false;
const authHttp = { currentUser: async () => null, rateLimit: () => null, readJsonBody: async r => r.body,
  jsonResponse: (value, status = 200) => ({ value, status, cookies: { set() {} } }), errorResponse: (error, status = 400) => ({ error, status }), serverErrorResponse: () => ({ status: 503 }) };
const authRoute = load('src/app/api/telegram/auth/route.ts', {
  'next/server': { NextResponse: { redirect: url => ({ status: 307, url: String(url), cookies: { set() {} } }) } },
  '@/lib/telegram/crypto': { verifyTelegramAuthDetailed: () => ({ ok: true, user: { id: 99, first_name: 'Ana' } }) },
  '@/lib/session': { sessionIsConfigured: () => true, setSessionCookie() {}, clearSessionCookie() {} },
  '@/server/http': authHttp,
  '@/server/account': { buildAccountPayload: async user => ({ user }) },
  '@/server/users': { upsertTelegramUser: async () => ({ id: 7, telegramId: 99 }) },
  '@/server/trial': { resolveTrial: async (...args) => { trialCalls.push(args); if (trialFails) throw Error('db down'); return { id: 'user-7' }; } },
  '@/db': { db: { execute: async () => null } }, 'drizzle-orm': { sql: () => null },
});
const authRequest = { body: { id: 99, hash: 'x' }, url: 'https://example.test/api/telegram/auth?id=99&hash=x', cookies: { get: () => null } };
assert.equal((await authRoute.POST(authRequest)).status, 200);
assert.equal(trialCalls.length, 1);
assert.equal(trialCalls[0][1], 7); assert.equal(trialCalls[0][2], true);
trialFails = true;
assert.equal((await authRoute.POST(authRequest)).status, 200, 'login must not fail when the trial row cannot be written');
trialFails = false;
assert.equal((await authRoute.GET(authRequest)).status, 307);
assert.equal(trialCalls.length, 3);
console.log('PASS: Telegram login (POST and redirect GET) starts the account trial; a trial write failure never blocks login.');

// --- Task 4: price comparisons, variant stored on the order ----------------
const comparisonsLib = load('src/lib/payments/comparisons.ts', { '@/lib/content/config': { payments: config.payments } });
const list = comparisonsLib.comparisons();
assert.equal(list.length, 8);
assert.deepEqual(list.map(c => c.id), ['coffee', 'supermarket', 'menu', 'group', 'cafe', 'netflix', 'gym', 'tutor']);
assert(list.every(c => typeof c.text === 'string' && c.text.length > 10));
assert.equal(comparisonsLib.comparisonFor(42).id, comparisonsLib.comparisonFor(42).id);
assert.equal(comparisonsLib.comparisonFor('42').id, comparisonsLib.comparisonFor(42).id);
assert(new Set(Array.from({ length: 200 }, (_, i) => comparisonsLib.comparisonFor(i + 1).id)).size >= 6);
assert.equal(comparisonsLib.knownVariant('menu'), 'menu');
assert.equal(comparisonsLib.knownVariant('x'), null);
assert.equal(comparisonsLib.knownVariant({}), null);
assert.equal(comparisonsLib.knownVariant('<script>'), null);

const catalogue = load('src/lib/payments/catalog.ts');
const orderVariants = [];
let invoiceStars = 0;
const invoiceRoute = load('src/app/api/payments/telegram/stars/route.ts', {
  '@/db': { db: { execute: async () => null } }, 'drizzle-orm': { sql: () => null },
  '@/lib/payments/catalog': catalogue, '@/lib/payments/comparisons': comparisonsLib,
  '@/lib/telegram/bot-api': { isBotConfigured: () => true, createStarsInvoiceLink: async v => { invoiceStars = v.stars; return 'https://t.me/$test'; } },
  '@/server/http': { ...authHttp, currentUser: async () => ({ id: 1, telegramId: 42 }), siteOrigin: () => 'https://example.test' },
  '@/server/trial': { resolveTrial: async () => ({ startedAt: new Date(0), completedAt: new Date(0) }), trialActive: () => false },
  '@/server/orders': { findPaidLicenseForUser: async () => null, attachInvoiceLink: async () => {}, createPendingOrder: async (_u, _p, variant) => { orderVariants.push(variant); return { id: 1, payload: 'p' }; } },
});
const invoiceRequest = body => ({ body, headers: { get: () => null }, cookies: { get: () => null } });
assert.equal((await invoiceRoute.POST(invoiceRequest({ productId: 'premium-monthly', variant: 'menu' }))).status, 200);
assert.equal((await invoiceRoute.POST(invoiceRequest({ productId: 'premium-monthly', variant: '<script>' }))).status, 200);
assert.equal((await invoiceRoute.POST(invoiceRequest({ productId: 'premium-monthly' }))).status, 200);
assert.deepEqual(orderVariants, ['menu', null, null]);
assert.equal(invoiceStars, 1490);
assert(fs.readFileSync('docs/migrations/20261027-price-variant.sql', 'utf8').includes('ADD COLUMN IF NOT EXISTS price_variant text'));
console.log('PASS: 8 comparisons, stable per-user assignment, unknown/forged variants stored as null, 1490-Star invoice, additive migration present.');

// --- Task 5: paywall analytics ----------------------------------------------
function analyticsWith({ consent, gtagThrows = false }) {
  const calls = [];
  const storage = { getItem: key => (key === 'espanolreal:analytics-consent:v1' && consent ? 'accepted' : null) };
  const window = { gtag: (...a) => { if (gtagThrows) throw Error('boom'); calls.push(['gtag', ...a]); }, ym: (...a) => calls.push(['ym', ...a]) };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/analytics/paywall.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, window, localStorage: storage, require: () => { throw Error('no imports expected'); } });
  return { track: exports.trackPaywall, calls };
}
{
  const off = analyticsWith({ consent: false }); off.track('paywall_view', 'menu'); assert.equal(off.calls.length, 0);
  const on = analyticsWith({ consent: true }); on.track('checkout_click', 'menu');
  assert.deepEqual(JSON.parse(JSON.stringify(on.calls)), [['gtag', 'event', 'checkout_click', { variant: 'menu' }], ['ym', 113580037, 'reachGoal', 'checkout_click', { variant: 'menu' }]]);
  const broken = analyticsWith({ consent: true, gtagThrows: true }); assert.doesNotThrow(() => broken.track('paywall_view', 'menu'));
}
const starsSource = fs.readFileSync('src/components/payments/telegram-stars.tsx', 'utf8');
assert(/comparisonFor\(/.test(starsSource) && /trackPaywall\("paywall_view"/.test(starsSource) && /trackPaywall\("checkout_click"/.test(starsSource) && /variant: comparison\.id/.test(starsSource), 'paywall must show a comparison, track view/click and send the variant');
const landingSource = fs.readFileSync('src/components/landing/landing-page.tsx', 'utf8');
assert(/PriceComparisonLine/.test(landingSource) && !/TelegramStarsPayment/.test(landingSource), 'landing shows the comparison text but no checkout');
console.log('PASS: paywall analytics only with consent, GA4 + Metrika goals carry the variant, analytics failures are swallowed; paywall and landing wired.');

// --- Task 6: start card with the lion ---------------------------------------
import React from 'react';
import jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
assert.equal(config.motivations.length, 22);
assert(config.motivations.every(m => typeof m === 'string' && !/\d+\s*(лет|год)/.test(m)), 'motivations must not carry ages');
assert(fs.existsSync('public/mascot/lion.png'));
const ui = { Card: p => React.createElement('div', null, p.children), Badge: p => React.createElement('span', null, p.children) };
const startCard = load('src/components/trainer/start-lesson-card.tsx', {
  'react/jsx-runtime': jsxRuntime, react: React,
  'next/image': { __esModule: true, default: p => React.createElement('img', { src: p.src, alt: p.alt }) },
  '@/components/auth/telegram-login': { TelegramLogin: () => React.createElement('button', null, 'telegram-login') },
  '@/components/ui/card': ui,
  '@/lib/content/config': { courseConfig: config },
  'lucide-react': { Volume2: () => React.createElement('svg') },
});
const teaserLesson = { lesson: 1, title: 'В кафе', phrases: [{ spanish: 'Un café con leche, por favor', translation: 'Кофе с молоком, пожалуйста' }, { spanish: '¿Me cobras?', translation: 'Посчитай меня' }, { spanish: 'SECRET', translation: 'закрыто' }] };
const cardHtml = renderToStaticMarkup(React.createElement(startCard.StartLessonCard, { lesson: teaserLesson }));
assert(cardHtml.includes('Первый урок бесплатно'));
assert(cardHtml.includes('/mascot/lion.png'));
assert(cardHtml.includes('¡Vamos!'));
assert(cardHtml.includes('Un café con leche, por favor') && cardHtml.includes('¿Me cobras?'));
assert(!cardHtml.includes('SECRET'), 'only two teaser phrases may appear');
assert(cardHtml.includes('telegram-login'));
assert((cardHtml.match(/<li/g) || []).length >= 22);
const trainerSource = fs.readFileSync('src/components/trainer/trainer-page.tsx', 'utf8');
assert(/response\.status === 401/.test(trainerSource) && /<StartLessonCard/.test(trainerSource), 'trainer must switch to the start card on 401 / signed-out');
assert(/lesson\.lesson === 1/.test(fs.readFileSync('src/components/seo/lesson-intro.tsx', 'utf8')), 'lesson 1 intro must not say Premium is required');
console.log('PASS: start card shows the lion, ¡Vamos!, exactly two teaser phrases, Telegram login and 22 age-free motivations; trainer wired for signed-out visitors.');
