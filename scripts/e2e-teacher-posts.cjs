const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:3100';
const source = 'В баре можно сказать «Me pones un café con leche, por favor». Обращаем внимание на контекст и вежливый тон.';
(async () => {
 const browser = await chromium.launch({headless:true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS||'[]')} : {})});
 try {
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await context.route('https://**/*',r=>r.abort());
  await context.addInitScript(()=>{
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.lastCopied=t}}});
    Object.defineProperty(navigator,'share',{value:undefined});
  });
  const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  async function noOverflow(path,width){
    await page.setViewportSize({width,height:844});await page.goto(base+path);await page.waitForTimeout(250);
    const overflow = await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    if(overflow) console.log(await page.evaluate(()=>Array.from(document.querySelectorAll('main *')).filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,70)}))));
    assert.equal(overflow,false,`${path} overflow at ${width}`);
  }
  for(const width of [320,360,390,768,1024,1280,1440]){
    await noOverflow('/',width);
    if(width<1280){await page.getByRole('button',{name:'Открыть меню'}).click();assert.ok(await page.getByRole('navigation',{name:'Мобильная навигация'}).isVisible());await page.getByRole('button',{name:'Закрыть меню'}).click();}
    await noOverflow('/teacher/posts/new',width);
  }
  for (const width of [320,390]) for (const route of ['/learn','/learn/lessons','/learn/map','/learn/stats','/learn/settings']) await noOverflow(route,width);
  await noOverflow('/teacher/posts/new',390);
  assert.equal(await page.getByRole('button',{name:'Сгенерировать WOW-пост',exact:true}).isEnabled(),true);
  assert.equal(await page.getByText(/Для аккаунта KristinaPerez9 сохраняется/).count(),0);
  await page.getByLabel('Исходный пост или заметка').fill(source);
  await page.getByLabel('Общая страница ваших уроков').fill('not-a-url');
  await page.getByLabel('Добавить ссылку на мои уроки').uncheck();
  assert.equal(await page.getByLabel('Общая страница ваших уроков').isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Сгенерировать WOW-пост',exact:true}).isEnabled(),true);
  await page.getByRole('button',{name:'Сгенерировать WOW-пост',exact:true}).click();
  await page.locator('article h2').waitFor();
  assert.equal(await page.locator('article a').count(),0);
  await page.getByLabel('Добавить ссылку на мои уроки').check();
  await page.getByLabel('Тема / ключевая фраза').fill('Me pones un café');
  await page.getByLabel('Исходный пост или заметка').fill(source);
  await page.getByLabel('Общая страница ваших уроков').fill('https://example.com/lessons');
  const progressKey='espanol-real:progress:v1';
  await page.waitForFunction(k=>localStorage.getItem(k),progressKey);
  const before=await page.evaluate(k=>localStorage.getItem(k),progressKey);
  await page.getByRole('button',{name:'Сгенерировать WOW-пост',exact:true}).click();
  await page.getByRole('heading',{name:'Me pones un café'}).waitFor();
  assert.ok(await page.getByRole('link',{name:'Уроки преподавателя →'}).isVisible());
  assert.equal(await page.getByRole('button',{name:'Опубликовать интерактивный пост'}).isDisabled(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.getByRole('button',{name:'Этой фразы в примере не было',exact:true}).click();
  await page.getByText(/Попробуйте ещё раз/).waitFor();
  await page.getByRole('button',{name:'Me pones un café con leche, por favor',exact:true}).click();
  await page.getByText(/Верно!/).waitFor();
  await page.getByRole('button',{name:'Редактировать ✎'}).click();
  await page.getByLabel('Заголовок', {exact:true}).fill('Кофе без школьного испанского');
  await page.getByRole('button',{name:'Предпросмотр',exact:true}).click();
  await page.getByRole('button',{name:'Скопировать текст для поста'}).click();
  assert.ok((await page.evaluate(()=>window.lastCopied)).includes('Кофе без школьного испанского'));
  await page.getByRole('button',{name:'Скопировать ссылку',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.lastCopied),'https://example.com/lessons');
  await page.getByRole('button',{name:'Instagram',exact:true}).click();
  assert.ok((await page.evaluate(()=>window.lastCopied)).includes(source));
  await page.waitForTimeout(800);await page.reload();await page.getByRole('heading',{name:'Кофе без школьного испанского'}).waitFor();
  await page.getByRole('button',{name:'Попробовать тестовый режим'}).click();
  assert.equal(await page.getByLabel('Исходный пост или заметка').inputValue(),source);
  await page.getByLabel('Конкретный урок').fill('https://example.com/coffee');
  await page.getByLabel('Название урока').fill('В баре');
  await page.getByRole('button',{name:'Сгенерировать WOW-пост',exact:true}).click();
  await page.getByRole('link',{name:'Продолжить урок «В баре» →'}).waitFor();
  // Loader and service error preserve source and already generated post.
  await page.route('**/api/teacher/posts/generate',async r=>{await new Promise(resolve=>setTimeout(resolve,500));await r.fulfill({status:502,json:{error:'QA: генерация недоступна'}})});
  await page.getByRole('button',{name:'Сгенерировать WOW-пост',exact:true}).click();
  await page.getByRole('button',{name:'Создаём интерактивный разбор…'}).waitFor();
  await page.getByRole('alert').filter({hasText:'QA: генерация недоступна'}).waitFor();
  assert.equal(await page.getByLabel('Исходный пост или заметка').inputValue(),source);
  await page.unroute('**/api/teacher/posts/generate');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),progressKey),before,'post flow mutated student progress');
  await page.evaluate(()=>window.scrollTo(0,0));
  if(process.env.POST_QA_SCREENSHOT)await page.screenshot({path:process.env.POST_QA_SCREENSHOT,fullPage:true});
  // Actual server auth/validation failures, not intercepted.
  assert.equal((await context.request.post(base+'/api/teacher/posts/publish',{headers:{origin:base},data:{}})).status(),401);
  assert.equal((await context.request.post(base+'/api/teacher/posts/generate',{headers:{origin:'https://evil.test'},data:{}})).status(),403);
  assert.equal((await context.request.post(base+'/api/teacher/posts/generate',{headers:{origin:base},data:{sourceText:'x'}})).status(),400);
  assert.equal((await context.request.get(base+'/api/teacher/posts/public?slug=invalid')).status(),404);
  // Simulated verified session + publish/read responses exercise UI only; actual ownership is covered by route/DB checks.
  await context.route('**/api/telegram/session',r=>r.fulfill({json:{ok:true,configured:true,botUsername:'test',starsPrice:500,productId:'premium-45',user:{telegramId:123,firstName:'QA',username:'KristinaPerez9'},premium:{active:false},orders:[]}}));
  await page.reload(); await page.getByRole('button',{name:'Сгенерировать WOW-пост',exact:true}).waitFor();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('textarea')).some(e=>e.closest('label')?.textContent.includes('Исходный пост или заметка') && e.value===''));
  assert.equal(await page.getByLabel('Исходный пост или заметка').inputValue(),'','guest draft leaked to signed-in account');
  const dto={title:'Пост QA',hook:'Одна фраза — новый разговор',example:'Un café',explanation:source,interactiveQuestion:{question:'Что закажем?',options:['Кофе','Чай'],correctIndex:0,feedback:'Un café — кофе'}};
  const cta={label:'Продолжить в EspanolReal',url:'https://espanolreal.es/learn'};
  const slug='post-00000000-0000-4000-8000-000000000001';
  await page.route('**/api/teacher/posts/generate',r=>r.fulfill({json:{ok:true,post:dto,mode:'mock',cta}}));
  await page.route('**/api/teacher/posts/publish',r=>r.fulfill({status:201,json:{ok:true,slug,path:'/teacher/posts/view?slug='+slug,cta}}));
  await page.route('**/api/teacher/posts/public?**',r=>r.fulfill({json:{ok:true,slug,post:dto,cta,authorName:'QA',mode:'mock',status:'published',publishedAt:'2026-10-04T00:00:00Z'}}));
  await page.getByLabel('Исходный пост или заметка').fill(source);
  await page.getByRole('button',{name:'Сгенерировать WOW-пост',exact:true}).click();
  await page.getByRole('link',{name:'Продолжить в EspanolReal →'}).waitFor();
  await page.getByRole('button',{name:'Опубликовать интерактивный пост'}).click();
  await page.getByRole('link',{name:'Открыть опубликованный пост →'}).click();
  await page.getByRole('heading',{name:'Пост QA'}).waitFor();
  await page.getByRole('button',{name:'Кофе',exact:true}).click();await page.getByText(/Верно!/).waitFor();
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),progressKey),before);
  await page.unroute('**/api/teacher/posts/public?**');
  await page.goto(base+'/teacher/posts/view?slug=invalid');await page.getByRole('alert').filter({hasText:'Пост не найден'}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('Responsive 320–1440px, mobile menu, real mock API, quiz, editing, copy/fallback, draft restore, loader/errors, auth/origin/validation, and unchanged student progress passed.');
  await context.close();
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
