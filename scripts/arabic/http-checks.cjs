const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { load } = require('./load-module.cjs');
const { arabicSeoPages, arabicPath } = load('src/lib/arabic/seo-content.ts');
const base = 'http://127.0.0.1:3100';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3100'], { stdio: ['ignore', 'pipe', 'pipe'] });
const read = async route => { const response = await fetch(base+route, { redirect: 'manual' }); return { response, html: await response.text() }; };
(async () => {
  await new Promise((resolve, reject) => { let output=''; const timer = setTimeout(() => reject(new Error('Server did not start')), 15000); server.stdout.on('data', d => { output += d; if (output.includes('Ready')) { clearTimeout(timer); resolve(); } }); server.stderr.on('data', d => { output += d; }); server.on('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${output}`)); }); });
  const sitemap = (await read('/sitemap.xml')).html;
  const links = new Set();
  for (const page of arabicSeoPages) {
    const route = arabicPath(page.slug); const { response, html } = await read(route);
    assert.equal(response.status, 200, route);
    assert.match(html, /<html[^>]*lang="ar"[^>]*dir="rtl"/);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, route+' must have one H1');
    assert(html.includes(page.h1), route+' H1 must be present without JS');
    assert(html.includes(`<title>${page.title}</title>`), route+' unique title');
    assert(html.includes(`name="description" content="${page.description}"`));
    assert(html.includes(`rel="canonical" href="https://espanolreal.es${route}"`));
    assert(html.includes(`property="og:url" content="https://espanolreal.es${route}"`));
    assert(html.includes(`property="og:title" content="${page.title}"`));
    assert(html.includes('name="twitter:card" content="summary_large_image"'));
    assert(html.includes('name="robots" content="index, follow"'));
    assert(sitemap.includes(`<loc>https://espanolreal.es${route}</loc>`));
    assert(!html.includes('hrefLang="fr"'));
    assert(html.includes('lang="es" dir="ltr"'));
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => JSON.parse(m[1]));
    assert.equal(schemas.length, 1);
    const faq = schemas[0]['@graph'].find(item => item['@type'] === 'FAQPage');
    assert.equal(faq.mainEntity.length, page.faq.length);
    for (const faqItem of faq.mainEntity) { assert(html.includes(faqItem.name)); assert(html.includes(faqItem.acceptedAnswer.text)); }
    for (const match of html.matchAll(/href="(\/[^"?#]*)/g)) if (!match[1].startsWith('/_next/') && !match[1].endsWith('.webmanifest')) links.add(match[1]);
  }
  for (const route of links) assert.equal((await read(route)).response.status, 200, 'broken internal link '+route);
  for (const slug of ['housing', 'doctor', 'work-documents']) {
    const { response, html } = await read('/ar/lesson/'+slug); assert.equal(response.status, 200); assert(html.includes('name="robots" content="noindex, follow"')); assert(html.includes('عبارات الدرس للقراءة والاستماع')); assert(!sitemap.includes('/ar/lesson/'+slug));
  }
  assert(!sitemap.includes('/ar/account'));
  const home = await read('/'); assert(home.html.includes('hrefLang="ar" href="https://espanolreal.es/ar"'));
  const arabicHomeHtml = (await read('/ar')).html; assert.match(arabicHomeHtml, /hrefLang="ru" href="https:\/\/espanolreal\.es\/?"/);
  for (const route of ['/lesson/1','/lesson/21','/learn','/teacher','/teacher/posts/new','/teachers','/privacy']) assert.equal((await read(route)).response.status, 200, route);
  const premium = await fetch(base+'/api/lessons/21'); assert([401,402,403].includes(premium.status), 'premium API must stay protected');
  assert.equal((await read('/ar/not-a-real-page')).response.status, 404);
  assert.equal((await read('/ar/lesson/not-a-real-lesson')).response.status, 404);
  assert.equal((await read('/ar-og.png')).response.status, 200);
  assert(!(await read('/robots.txt')).html.includes('Disallow: /ar'));
  console.log(`PASS: 10 HTTP 200 Arabic pages; raw SSR lang/dir, H1, metadata, schema, sitemap; ${links.size} internal links; noindex trainer/account; reciprocal RU/AR; 404 and Premium API protection; original routes.`);
})().catch(error => { console.error(error); process.exitCode=1; }).finally(() => server.kill('SIGTERM'));
