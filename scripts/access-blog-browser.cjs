const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
const base = process.env.ACCESS_BLOG_QA_BASE || 'http://127.0.0.1:3100';
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  const context = await browser.newContext({serviceWorkers:'block'});
  await context.route('https://**/*', route => route.abort());
  const account={ok:true,configured:true,botUsername:'TestBot',starsPrice:1790,productId:'premium-monthly',user:{telegramId:42,firstName:'Test'},blogAdmin:true,premium:{active:false,expiresAt:null},orders:[]};
  let active=true,articles=[];
  const fulfill=(route,data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  await context.route('**/api/telegram/session', r=>fulfill(r,account));
  await context.route('**/api/trial', r=>{if(r.request().method()==='POST') active=false;return fulfill(r,{active,expiresAt:null});});
  await context.route('**/api/admin/blog',r=>{
   if(r.request().method()==='GET')return fulfill(r,{articles});
   const article={...r.request().postDataJSON(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};articles=[article];return fulfill(r,{article},r.request().method()==='POST'?201:200);
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/');
  assert.equal(await page.locator('a[href*="#premium"]').count(),0);
  assert.equal(await page.getByRole('link',{name:'Преподавателям',exact:true}).count(),0);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`landing overflow ${width}`);}
  await page.goto(base+'/learn/settings');
  await page.getByText('Попробуйте первый урок бесплатно',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Оплатить 1790 ⭐',exact:true}).count(),0);
  active=false;await page.evaluate(()=>window.dispatchEvent(new Event('er-trial-changed')));
  await page.getByRole('button',{name:'Оплатить 1790 ⭐',exact:true}).waitFor();
  await page.goto(base+'/admin/blog');
  await page.getByLabel('Заголовок',{exact:true}).fill('Живой испанский в кафе');
  await page.getByLabel('Адрес статьи',{exact:true}).fill('ispanskiy-v-kafe');
  await page.getByLabel('Краткое описание',{exact:true}).fill('Практические фразы и небольшие упражнения для жизни в Испании.');
  await page.getByLabel('Текст статьи',{exact:true}).fill('## Первое действие\n\n<script>alert(1)</script> Попробуйте одну фразу сегодня.');
  await page.getByRole('button',{name:'Предпросмотр',exact:true}).click();
  await page.getByRole('heading',{name:'Первое действие'}).waitFor();
  await page.getByRole('button',{name:'Сохранить черновик',exact:true}).click();
  await page.getByText('Черновик сохранён',{exact:true}).waitFor();assert.equal(articles[0].published,false);
  await page.getByLabel('Опубликовать на сайте',{exact:true}).check();
  await page.getByRole('button',{name:'Сохранить и опубликовать',exact:true}).click();
  await page.getByText('Статья опубликована',{exact:true}).waitFor();assert.equal(articles[0].published,true);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`editor overflow ${width}`);}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/espanolreal-blog-editor.png',fullPage:true});
  await page.getByLabel('Опубликовать на сайте',{exact:true}).uncheck();await page.getByRole('button',{name:'Сохранить черновик',exact:true}).click();await page.getByText('Черновик сохранён',{exact:true}).waitFor();assert.equal(articles[0].published,false);
  assert.deepEqual(errors,[]);
  // Real HTTP responses, without browser network mocks.
  const publicHtml=await (await fetch(base+'/lesson/1')).text();
  const lesson=JSON.parse(fs.readFileSync('data/lessons/lesson001.json','utf8'));
  assert(!publicHtml.includes(lesson.phrases[3].example));
  assert.equal((await fetch(base+'/api/admin/blog')).status,401);
  assert.equal((await fetch(base+'/blog')).status,200);
  assert.equal((await fetch(base+'/blog/not-a-real-article')).status,404);
  console.log('PASS: landing has no checkout/teacher link; checkout appears only after trial end; editor draft/preview/publish/unpublish; 320/390/768/1440 widths; no JS errors. Browser account/storage APIs were mocked. Real HTTP: no full lesson leak, admin 401, blog 200, missing article 404.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
