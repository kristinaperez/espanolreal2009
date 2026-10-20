import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import crypto from 'node:crypto';
import React from 'react';
import jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
function load(file, aliases = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, process, Buffer, Date, console, require: name => { if (!(name in aliases)) throw Error(`Unexpected import ${name}`); return aliases[name]; } });
  return exports;
}
const catalogue = load('src/lib/payments/catalog.ts');
process.env.TELEGRAM_STARS_PRICE = '500';
assert.equal(catalogue.starsPrice(), 1790);
assert.equal(catalogue.premiumProduct().id, 'premium-monthly');
assert.equal(catalogue.premiumProduct().lifetime, false);
const policy = load('src/lib/payments/access.ts', { './catalog': catalogue });
const paidAt = new Date('2026-10-01T00:00:00Z'), end = paidAt.getTime() + catalogue.ACCESS_PERIOD_MS;
assert(policy.licenseIsActive('premium-monthly', paidAt, end - 1));
assert(!policy.licenseIsActive('premium-monthly', paidAt, end));
assert(!policy.licenseIsActive('premium-monthly', null, end));
assert(policy.licenseIsActive('premium-45', paidAt, end + 20 * catalogue.ACCESS_PERIOD_MS));
assert(!policy.licenseIsActive('forged-product', paidAt, paidAt.getTime()));
assert.equal(policy.monthlyExpiry([{productId:'premium-monthly', paidAt}, {productId:'premium-monthly', paidAt}]).getTime(), paidAt.getTime() + 2 * catalogue.ACCESS_PERIOD_MS);
const later = new Date(end + 86400000);
assert.equal(policy.monthlyExpiry([{productId:'premium-monthly', paidAt}, {productId:'premium-monthly', paidAt: later}]).getTime(), later.getTime() + catalogue.ACCESS_PERIOD_MS);
assert.equal(policy.monthlyExpiry([]), null);
console.log('PASS: fixed price, new SKU, expiry boundary, legacy access, stacked payments and renewal after a gap.');

process.env.SESSION_SECRET = 'test-independent-secret-at-least-32-bytes';
const trial = load('src/server/trial.ts', {
  'node:crypto': crypto, 'drizzle-orm': {}, '@/db': {}, '@/db/blog-schema': {}, '@/lib/session': {sessionCookieOptions: () => ({httpOnly:true})},
});
assert(trial.trialActive({startedAt:paidAt,completedAt:null}, paidAt.getTime()+trial.TRIAL_MS-1));
assert(!trial.trialActive({startedAt:paidAt,completedAt:null}, paidAt.getTime()+trial.TRIAL_MS));
assert(!trial.trialActive({startedAt:paidAt,completedAt:paidAt}, paidAt.getTime()+1));
let cookie;
trial.setTrialCookie({cookies:{set:(name,value) => {cookie=value;}}}, '12345678-1234-1234-1234-123456789abc');
assert.equal(trial.readTrialId(cookie), '12345678-1234-1234-1234-123456789abc');
assert.equal(trial.readTrialId(cookie.replace(/^1/,'2')), null);
assert.equal(trial.readTrialId('forged'), null);
console.log('PASS: seven-day exact boundary, first completion, signed guest identity and cookie tampering.');

let user = null, activeLicense = null, row = null, completions = 0;
const http = {currentUser: async () => user, rateLimit: () => null, jsonResponse: (value,status=200) => ({value,status}), errorResponse: (error,status=400) => ({error,status}), serverErrorResponse: () => ({status:503}), readJsonBody:async r => r.body};
const request = {cookies:{get:()=>null}, headers:{get:()=> 'https://example.test'},nextUrl:{origin:'https://example.test'}};
const trialService = {resolveTrial:async (_r,_id,start) => row ?? (start ? (row={id:'guest-id',startedAt:new Date(),completedAt:null}) : null), setTrialCookie:()=>{}, trialActive:trial.trialActive, TRIAL_MS:trial.TRIAL_MS, completeTrial:async()=>{completions++; row.completedAt ??= new Date();}};
const lessonRoute = load('src/app/api/lessons/[n]/route.ts', {'@/lib/content/loader':{getLesson:n=>n===1 || n===2?{lesson:n,phrases:['protected']}:null,getDistractorPool:()=>[]},'@/server/http':http,'@/server/orders':{findPaidLicenseForUser:async()=>activeLicense},'@/server/trial':trialService});
const getLesson = n => lessonRoute.GET(request, {params:Promise.resolve({n:String(n)})});
assert.equal((await getLesson('nope')).status,400);
assert.equal((await getLesson(99)).status,404);
assert.equal((await getLesson(2)).status,402);
assert.equal((await getLesson(1)).status,200);
const trialRoute = load('src/app/api/trial/route.ts', {'@/server/http':http,'@/server/trial':trialService});
assert.equal((await trialRoute.POST({...request,headers:{get:()=> 'https://evil.test'}})).status,403);
assert.equal(completions,0);
assert.equal((await trialRoute.POST(request)).status,200);
assert.equal((await trialRoute.POST(request)).status,200);
assert.equal((await getLesson(1)).status,402);
row={id:'guest-id',startedAt:new Date(Date.now()-trial.TRIAL_MS),completedAt:null};
assert.equal((await getLesson(1)).status,402);
user={id:1,telegramId:42}; activeLicense={id:1};
assert.equal((await getLesson(2)).status,200);
console.log('PASS: real lesson/trial route functions with mocked storage: invalid/unknown lessons, no lesson-2 trial, first lesson, completion replay, expiry, paid access, CSRF rejection.');

const model=load('src/lib/blog.ts');
const article={slug:'first-article',title:'Первая статья',description:'Практика разговорного испанского',body:'## Первая фраза\n\n<script>alert(1)</script> & текст',published:false};
assert(model.parseArticle(article));
for (const input of [{...article,slug:'../escape'}, {...article,published:'true'}, {...article,title:''}, {...article,body:'x'.repeat(50001)}]) assert.equal(model.parseArticle(input),null);
const body=load('src/components/blog/article-body.tsx', {'react/jsx-runtime':jsxRuntime});
const html=renderToStaticMarkup(React.createElement(body.ArticleBody,{body:article.body}));
assert(html.includes('<h2'));assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));
process.env.BLOG_ADMIN_TELEGRAM_IDS='42, 77';
const blogService=load('src/server/blog.ts', {'drizzle-orm':{},'@/db':{},'@/db/blog-schema':{}});
assert(blogService.isBlogAdmin(42));assert(!blogService.isBlogAdmin(43));assert(!blogService.isBlogAdmin());
let saved = null;
const blogDb = {insert:()=>({values:v=>({onConflictDoNothing:()=>({returning:async()=>saved?[]:[saved=v]})})}),update:()=>({set:v=>({where:()=>({returning:async()=> saved ? [saved=v] : []})})})};
const admin = load('src/app/api/admin/blog/route.ts', {'drizzle-orm':{eq:()=>true},'@/db':{db:blogDb},'@/db/blog-schema':{blogArticles:{}},'@/lib/blog':model,'@/server/blog':{isBlogAdmin:blogService.isBlogAdmin,listArticles:async()=>saved?[saved]:[]},'@/server/http':http});
user=null;assert.equal((await admin.GET(request)).status,401);
user={id:2,telegramId:43};assert.equal((await admin.POST({...request,body:{...article,telegramId:42}})).status,403);
assert.equal(saved,null);
user={id:1,telegramId:42};assert.equal((await admin.POST({...request,body:article,headers:{get:()=> 'https://evil.test'}})).status,403);
assert.equal((await admin.POST({...request,body:{...article,slug:'INVALID'}})).status,400);
assert.equal((await admin.POST({...request,body:article})).status,201);
assert.equal(saved.published,false);
assert.equal((await admin.POST({...request,body:article})).status,409);
assert.equal((await admin.PUT({...request,body:{...article,published:true}})).status,200);
assert.equal(saved.published,true);
assert.equal((await admin.PUT({...request,body:{...article,published:false}})).status,200);
assert.equal(saved.published,false);
console.log('PASS: article validation, escaped HTML, server admin allowlist, guest/forged-admin rejection, CSRF, create/draft/publish/unpublish/duplicate slug. Storage is mocked, not a live PostgreSQL integration.');
let invoices=0;
const invoiceRoute=load('src/app/api/payments/telegram/stars/route.ts', {
 '@/db':{db:{execute:async()=>null}},'drizzle-orm':{sql:()=>null},
 '@/lib/payments/catalog':catalogue,
 '@/lib/telegram/bot-api':{isBotConfigured:()=>true,createStarsInvoiceLink:async value=>{invoices++;assert.equal(value.stars,1790);return 'https://t.me/$test';}},
 '@/server/http':{...http,siteOrigin:()=> 'https://example.test'},
 '@/server/trial':trialService,
 '@/server/orders':{findPaidLicenseForUser:async()=>activeLicense,createPendingOrder:async()=>({id:1,payload:'test-payload'}),attachInvoiceLink:async()=>{}},
});
user=null;activeLicense=null;assert.equal((await invoiceRoute.POST(request)).status,401);
user={id:1,telegramId:42};row=null;assert.equal((await invoiceRoute.POST(request)).status,409);
row={startedAt:new Date(),completedAt:null};assert.equal((await invoiceRoute.POST(request)).status,409);
assert.equal(invoices,0);
row.completedAt=new Date();assert.equal((await invoiceRoute.POST({...request,body:{productId:'premium-45'}})).status,404);
assert.equal((await invoiceRoute.POST({...request,body:{productId:'premium-monthly'}})).status,200);
assert.equal(invoices,1);
activeLicense={id:1};assert.equal((await invoiceRoute.POST(request)).status,409);
console.log('PASS: invoice route rejects guests, unused/active trial, legacy SKU and already-active Premium; expired trial creates exactly a 1790-Star invoice (mock Telegram and storage).');
