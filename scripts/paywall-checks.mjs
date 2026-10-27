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
