const {chromium}=require('playwright');const assert=require('node:assert/strict');
const base=process.argv[2]||'http://127.0.0.1:3100';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS||'[]')}:{})});
 try {
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});await context.route('https://**/*',r=>r.abort());
 await context.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.copied=t}}}));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/teacher/posts/new');await page.getByRole('button',{name:'Деньги',exact:true}).click();await page.getByLabel('Добавить ссылку на мои уроки').uncheck();
 await page.getByRole('button',{name:'Сгенерировать WOW-пост',exact:true}).click();const picker=page.getByRole('region',{name:'Выбрать мем'});await picker.waitFor();
 const key='espanolreal:teacher-posts:draft:v1:guest';const progress='espanol-real:progress:v1';const before=await page.evaluate(k=>localStorage.getItem(k),progress);
 for(const label of ['Ожидание / реальность','Без слов','Маленькая драма']){await picker.getByRole('button',{name:label,exact:true}).click();assert.equal(await picker.getByRole('button',{name:label,exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('article figure').count(),1);}
 await picker.getByRole('button',{name:'Без мема',exact:true}).click();assert.equal(await page.locator('article figure').count(),0);assert.equal(await page.getByRole('region',{name:'Тренажёр WOW-поста'}).count(),1);
 await page.waitForTimeout(750);await page.reload();assert.equal(await picker.getByRole('button',{name:'Без мема',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('article figure').count(),0);
 await picker.getByRole('button',{name:'Ожидание / реальность',exact:true}).click();await page.waitForTimeout(750);await page.reload();assert.equal(await picker.getByRole('button',{name:'Ожидание / реальность',exact:true}).getAttribute('aria-pressed'),'true');
 const png=await page.screenshot();await picker.getByLabel('Загрузить свою картинку',{exact:true}).setInputFiles({name:'own.png',mimeType:'image/png',buffer:png});await picker.getByText('Выбрана своя картинка',{exact:true}).waitFor();
 const image=page.locator('article figure img');await image.waitFor();const src=await image.getAttribute('src');assert.ok(src.startsWith('data:image/jpeg;base64,/9j/'));assert.ok(src.length<=160000);await page.waitForFunction(()=>document.querySelector('article figure img')?.naturalWidth>0);
 await picker.getByRole('button',{name:'Без мема',exact:true}).click();assert.equal(await page.locator('article figure').count(),0);await picker.getByRole('button',{name:'Вернуть свою картинку',exact:true}).click();await image.waitFor();assert.equal(await image.getAttribute('src'),src);
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'Скачать свою картинку',exact:true}).click();assert.equal((await dl).suggestedFilename(),'wow-meme-upload.jpg');
 await page.waitForTimeout(750);await page.reload();await page.waitForFunction(()=>document.querySelector('article figure img')?.naturalWidth>0);assert.equal(await image.getAttribute('src'),src);
 await page.getByRole('button',{name:'Скопировать текст для поста'}).click();assert.equal((await page.evaluate(()=>window.copied)).includes('data:image'),false);
 await picker.getByLabel('Загрузить свою картинку',{exact:true}).setInputFiles({name:'unsafe.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});await picker.getByRole('alert').waitFor();assert.equal(await image.getAttribute('src'),src);
 await picker.getByLabel('Ссылка на GIF').fill('javascript:alert(1)');await picker.getByRole('button',{name:'Использовать ссылку'}).click();await picker.getByText('Нужен полный публичный адрес https://…',{exact:true}).waitFor();
 await picker.getByLabel('Ссылка на GIF').fill('https://example.com/meme.gif');await picker.getByRole('button',{name:'Использовать ссылку'}).click();await picker.getByText('Выбрана своя картинка / GIF',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Скопировать текст для поста'}).click();assert.ok((await page.evaluate(()=>window.copied)).includes('https://example.com/meme.gif'));
 await picker.getByRole('button',{name:'Без мема',exact:true}).click();await page.getByRole('button',{name:'Скопировать текст для поста'}).click();assert.equal((await page.evaluate(()=>window.copied)).includes('https://example.com/meme.gif'),false);
 await picker.getByRole('button',{name:'Без слов',exact:true}).click();
 for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'picker overflow '+width);}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:process.env.MEME_QA_SCREENSHOT||'/tmp/meme-picker-qa.png',fullPage:true});
 await page.waitForTimeout(750);const stored=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).generated.post,key);
 const slug='post-00000000-0000-4000-8000-000000000001';let dto=stored;
 await page.route('**/api/teacher/posts/public?**',r=>r.fulfill({json:{ok:true,slug,post:dto,cta:null,authorName:'QA',mode:'mock',status:'published',publishedAt:'2026-10-04T00:00:00Z'}}));
 await page.goto(base+'/teacher/posts/view?slug='+slug);await page.locator('article figure').waitFor();assert.equal(await page.getByRole('region',{name:'Выбрать мем'}).count(),0);
 dto={...stored,visual:{...stored.visual,enabled:false}};await page.reload();await page.locator('article').waitFor();assert.equal(await page.locator('article figure').count(),0);
 dto={...stored,visual:{...stored.visual,enabled:true,mediaUrl:'',uploadedImage:src}};await page.reload();await page.waitForFunction(()=>document.querySelector('article figure img')?.naturalWidth>0);assert.equal(await image.getAttribute('src'),src);
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),progress),before);assert.deepEqual(errors,[]);
 console.log('Meme picker: 3 variants, none, file normalization/restore/download, safe URL replacement, no media in opt-out copy/public post, public uploaded image, mobile widths and unchanged student progress passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
