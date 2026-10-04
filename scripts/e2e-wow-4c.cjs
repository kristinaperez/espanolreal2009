const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const base=process.argv[2]||'http://127.0.0.1:3100';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS||'[]')}:{})});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await context.route('https://**/*',r=>r.abort());
  await context.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.copied=t}}}));
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/teacher/posts/new');await page.getByRole('button',{name:'Деньги',exact:true}).click();
  await page.getByLabel('Добавить ссылку на мои уроки').uncheck();
  const progressKey='espanol-real:progress:v1';await page.waitForFunction(k=>localStorage.getItem(k),progressKey);
  const before=await page.evaluate(k=>localStorage.getItem(k),progressKey);
  await page.getByRole('button',{name:'Сгенерировать WOW-пост',exact:true}).click();
  await page.getByRole('heading',{name:'Билет за 300 €, на карте — 1 €. Испанский понимает твою боль'}).waitFor();
  assert.ok(await page.getByRole('img',{name:'шок от ценника и бессилие пустого кошелька'}).isVisible());
  assert.equal(await page.locator('article a').count(),0);
  const trainer=page.getByRole('region',{name:'Тренажёр WOW-поста'});
  await trainer.getByRole('button',{name:'Tengo un ojo blanco para el concierto.',exact:true}).click();await trainer.getByText(/Попробуйте ещё раз/).waitFor();
  await trainer.getByRole('button',{name:'¡Cuesta un ojo de la cara! Y además estoy sin blanca.',exact:true}).click();await trainer.getByText(/Верно!/).waitFor();
  await trainer.getByRole('button',{name:'Следующее задание →'}).click();
  await trainer.getByRole('button',{name:'Estoy sin blanca — я ослеп на один глаз.',exact:true}).click();await trainer.getByText(/Верно!/).waitFor();
  await trainer.getByRole('button',{name:'Следующее задание →'}).click();
  await trainer.getByLabel('Ваш ответ').fill('mano');await trainer.getByRole('button',{name:'Проверить ответ'}).click();await trainer.getByText(/Попробуйте ещё раз/).waitFor();
  await trainer.getByLabel('Ваш ответ').fill(' OJO! ');await trainer.getByRole('button',{name:'Проверить ответ'}).click();await trainer.getByText(/Верно!/).waitFor();
  await trainer.getByRole('button',{name:'Следующее задание →'}).click();
  await trainer.getByRole('button',{name:'No puedo, estoy sin blanca.',exact:true}).click();await trainer.getByRole('button',{name:'Следующее задание →'}).click();
  assert.equal(await trainer.getByRole('button',{name:'Завершить вызов'}).isDisabled(),true);
  await trainer.getByLabel('Ваша реплика').fill('El alquiler cuesta un ojo de la cara.');await trainer.getByRole('button',{name:'Завершить вызов'}).click();await trainer.getByText('4 из 4 проверяемых заданий',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Скопировать текст',exact:true}).click();const copied=await page.evaluate(()=>window.copied);assert.ok(copied.includes('5. Что в последнее время'));assert.equal(copied.includes('Первая часть — про дорогой билет'),false);
  await page.getByRole('button',{name:'Скопировать ответы отдельно'}).click();assert.ok((await page.evaluate(()=>window.copied)).includes('Первая часть — про дорогой билет'));
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Скачать мем-карточку PNG'}).click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'wow-meme-card.png');assert.equal(await download.failure(),null);
  for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'4C overflow '+width);}
  await page.getByRole('button',{name:'Редактировать ✎'}).click();
  await page.getByLabel('Задание 1',{exact:true}).fill('Друг зовёт на дорогой концерт. Какая реакция?');
  await page.getByLabel('Подпись на меме',{exact:true}).fill('Планы на вечер / Баланс: 1 €');
  await page.getByRole('button',{name:'Предпросмотр',exact:true}).click();await trainer.getByText('Друг зовёт на дорогой концерт. Какая реакция?',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Скопировать текст',exact:true}).isEnabled(),true,'editing failed to sync first quiz');
  await page.waitForTimeout(750);await page.reload();await page.getByText('Планы на вечер / Баланс: 1 €',{exact:true}).waitFor();
  for(const [name,title]of [['Aprovechar','У тебя 20 минут до поезда. Пролистать ленту или поймать шанс?'],['Saber / saberse','Знаешь песню — или уже поёшь за весь вагон?']]){
   await page.getByRole('button',{name,exact:true}).click();await page.getByRole('button',{name:'Сгенерировать WOW-пост',exact:true}).click();await page.getByRole('heading',{name:title,exact:true}).waitFor();assert.equal(await trainer.getByText('1 / 5',{exact:true}).count(),1);
  }
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),progressKey),before);
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.wow-face-one').evaluate(e=>getComputedStyle(e).animationName),'none');
  if(process.env.POST_QA_SCREENSHOT){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:process.env.POST_QA_SCREENSHOT.replace('.png','-4c.png'),fullPage:true});}
  assert.deepEqual(errors,[]);console.log('4C: three sources, original visual, five-step quiz/trap/fill/reaction/open, answers separate, PNG download, responsive 320–1280, editing/sync/autosave, reduced motion and unchanged course progress passed.');
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
