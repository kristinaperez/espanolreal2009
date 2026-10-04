/* Run against a local/staging build; Playwright and its browsers must be installed. */
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:3100';
const lessonPath = '/practice/demo-pedir-en-un-cafe';
const configuredContacts = process.env.TEST_TEACHER_CONTACTS === 'true';
const progressKey = 'espanol-real:progress:v1';
async function run(browserType, name, viewport, signedIn = false) {
  const browser = await browserType.launch({headless:true, ...(name.startsWith("Chromium") && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS || "[]") } : {})});
  const context = await browser.newContext({viewport, serviceWorkers:'block'});
  // Third-party production scripts aren't necessary for this isolated slice.
  await context.route('https://**/*', route => route.abort());
  if (signedIn) await context.route('**/api/telegram/session', route => route.fulfill({json:{ok:true,configured:true,botUsername:'test',starsPrice:500,productId:'premium-45',user:{telegramId:123,firstName:'QA'},displayName:'QA',premium:{active:true},orders:[]}}));
  await context.addInitScript(() => {
    window.teacherEvents = [];
    window.addEventListener('espanolreal:teacher-analytics', event => window.teacherEvents.push(event.detail));
  });
  const page = await context.newPage();
  const errors=[]; page.on('pageerror', error => errors.push(error.message));
  await page.goto(base+lessonPath+'?utm_source=qa&utm_medium=test&utm_campaign=phase1');
  await page.getByRole('button',{name:'Начать практику'}).waitFor();
  await page.waitForFunction(key => localStorage.getItem(key),progressKey);
  const before = await page.evaluate(key=>localStorage.getItem(key),progressKey);
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex, follow');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://espanolreal.es'+lessonPath);
  assert.equal((await page.content()).includes('demo-teacher@example.invalid'),false,'private email leaked');
  const viewEvents=await page.evaluate(()=>window.teacherEvents.filter(e=>e.event==='teacher_lesson_view'));
  assert.equal(viewEvents.length,1);assert.equal(viewEvents[0].properties.utm_source,'qa');
  assert.ok(viewEvents[0].properties.visitor_id);
  await page.getByRole('button',{name:'Начать практику'}).click();
  assert.equal(await page.getByRole('button',{name:'Проверить',exact:true}).isDisabled(),true);
  await page.getByLabel('La cuenta, por favor.',{exact:true}).check();
  await page.getByRole('button',{name:'Проверить',exact:true}).click();
  await page.getByText('Посмотрите правильный ответ',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Следующий вопрос'}).click();
  await page.getByLabel('Я хотел(а) бы чай',{exact:true}).check();
  await page.getByRole('button',{name:'Проверить',exact:true}).click();
  await page.getByText('Верно!',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Следующий вопрос'}).click();
  await page.getByLabel('Ваш ответ по-испански').fill(' LA CUENTA, POR FAVOR. ');
  await page.getByRole('button',{name:'Проверить',exact:true}).click();
  await page.getByRole('button',{name:'Завершить практику'}).click();
  await page.getByText('Результат: 2 из 3',{exact:true}).waitFor();
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),progressKey),before,'Teacher practice mutated student progress');
  const events=await page.evaluate(()=>window.teacherEvents);
  assert.equal(events.filter(e=>e.event==='teacher_lesson_start').length,1);
  assert.equal(events.filter(e=>e.event==='teacher_question_answered').length,3);
  assert.equal(events.filter(e=>e.event==='teacher_lesson_complete').length,1);
  assert.equal(events.find(e=>e.event==='teacher_lesson_complete').properties.score,2);
  if(configuredContacts){
    const booking=page.getByRole('link',{name:/Записаться на урок к/});
    assert.equal(await booking.count(),1);
    assert.equal(await booking.getAttribute('rel'),'noopener noreferrer');
    const popupPromise=context.waitForEvent('page');await booking.click();const popup=await popupPromise;await popup.close();
    assert.equal(await page.evaluate(()=>window.teacherEvents.filter(e=>e.event==='teacher_booking_click').length),1);
    assert.equal(await page.evaluate(()=>window.teacherEvents.find(e=>e.event==='teacher_booking_click').properties.booking_provider),'calendly');
  } else {assert.equal(await page.getByRole('link',{name:/Записаться на урок к/}).count(),0);}
  await page.getByRole('link',{name:'Демо-преподаватель →'}).click();
  await page.getByRole('heading',{name:'Демо-преподаватель',exact:true}).waitFor();
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex, follow');
  if(configuredContacts){
    for(const label of ['Telegram','WhatsApp','VK']) assert.equal(await page.getByRole('link',{name:label,exact:true}).count(),1);
    const popupPromise=context.waitForEvent('page');await page.getByRole('link',{name:'Telegram',exact:true}).click();const popup=await popupPromise;await popup.close();
    assert.equal(await page.evaluate(()=>window.teacherEvents.filter(e=>e.event==='teacher_social_click').length),1);
  }
  assert.ok(await page.evaluate(()=>window.teacherEvents.some(e=>e.event==='teacher_author_click')));
  assert.ok(await page.evaluate(()=>window.teacherEvents.some(e=>e.event==='teacher_profile_view')));
  await page.goBack();await page.getByRole('heading',{name:'Как заказать в кафе по-испански'}).waitFor();
  await page.reload();await page.getByRole('button',{name:'Начать практику'}).waitFor();
  // Exercise native keyboard controls and a perfect retry.
  await page.getByRole('button',{name:'Начать практику'}).click();
  await page.getByLabel('Un café con leche, por favor.',{exact:true}).check();
  await page.getByRole('button',{name:'Проверить',exact:true}).click();await page.getByRole('button',{name:'Следующий вопрос'}).click();
  await page.getByLabel('Я хотел(а) бы чай',{exact:true}).check();await page.getByRole('button',{name:'Проверить',exact:true}).click();await page.getByRole('button',{name:'Следующий вопрос'}).click();
  await page.getByLabel('Ваш ответ по-испански').fill('La cuenta por favor');await page.getByLabel('Ваш ответ по-испански').press('Enter');await page.getByRole('button',{name:'Завершить практику'}).click();await page.getByText('Результат: 3 из 3',{exact:true}).waitFor();
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),progressKey),before);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'horizontal overflow');
  if(process.env.TEACHER_QA_SCREENSHOT) await page.screenshot({path:process.env.TEACHER_QA_SCREENSHOT,fullPage:true});
  await page.goto(base+'/teachers');await page.getByRole('heading',{name:'Учителя',exact:true}).waitFor();
  await page.goto(base+'/teachers/not-a-teacher');assert.equal(await page.getByRole('heading',{level:1}).count(),1);
  const unknown=await context.request.get(base+'/practice/not-a-lesson');assert.equal(unknown.status(),404);
  const sitemap=await (await context.request.get(base+'/sitemap.xml')).text();assert.equal(sitemap.includes('/practice/'),false);assert.equal(sitemap.includes('/teachers'),false);
  const robots=await (await context.request.get(base+'/robots.txt')).text();assert.equal(robots.includes('Disallow: /practice'),false);
  assert.equal((await context.request.get(base+'/lesson/1')).status(),200);
  assert.equal((await context.request.get(base+'/lesson/8')).status(),200);
  assert.deepEqual(errors,[]);
  await browser.close();console.log(`PASS ${name}${signedIn?' (simulated signed-in session)':''}`);
}
(async()=>{
 await run(chromium,'Chromium desktop',{width:1280,height:900});
 await run(chromium,'Chromium mobile 360px',{width:360,height:780},true);
 if(process.env.TEACHER_QA_CHROMIUM_ONLY !== 'true') await run(webkit,'WebKit mobile 390px',{width:390,height:844});
 else console.log('SKIP WebKit: browser unavailable; real Safari/PWA QA remains required.');
})().catch(error=>{console.error(error);process.exit(1)});
