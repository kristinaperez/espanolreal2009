/* Optional browser/device-layout check. Not claimed as executed without a working browser binary. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const { load } = require('./load-module.cjs');
const { arabicSeoPages, arabicPath } = load('src/lib/arabic/seo-content.ts');
const base = process.env.ARABIC_QA_BASE || 'http://127.0.0.1:3100';
const screenshots = process.env.ARABIC_QA_SCREENSHOTS || '/tmp/espanolreal-arabic-screenshots';
const server = process.env.ARABIC_QA_BASE ? null : spawn(process.execPath, ['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3100'], { stdio: ['ignore','pipe','pipe'] });
(async()=>{
  let browser;
  try {
    if(server) await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(new Error('Server start timeout')),15000);server.stdout.on('data',d=>{output+=d;if(output.includes('Ready')){clearTimeout(timer);resolve()}});server.on('exit',code=>{clearTimeout(timer);reject(new Error('Server exited '+code))})});
    browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}: {})});
    fs.mkdirSync(screenshots,{recursive:true});
    const context=await browser.newContext({serviceWorkers:'block'});
    await context.route('https://**/*',r=>r.abort());
    const errors=[];const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>localStorage.setItem('espanolreal:analytics-consent:v1','rejected'));
    for(const width of [360,390,430,1280]){
      await page.setViewportSize({width,height:900});
      for(const content of arabicSeoPages){
        const response=await page.goto(base+arabicPath(content.slug));assert.equal(response.status(),200);
        await page.getByRole('heading',{level:1,name:content.h1}).waitFor();
        assert.equal(await page.locator('html').getAttribute('lang'),'ar');assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),`horizontal overflow at ${width}: ${content.slug}`);
      }
      await page.goto(base+'/ar/lesson/housing');await page.getByRole('button',{name:'ابدأ الدرس',exact:true}).click();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
      await page.screenshot({path:`${screenshots}/housing-${width}.png`,fullPage:true});
      await page.goto(base+'/ar');await page.screenshot({path:`${screenshots}/landing-${width}.png`,fullPage:true});
    }
    assert.deepEqual(errors,[]);
    await page.getByRole('button',{name:'Русский',exact:true}).click();await page.waitForURL(base+'/');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
    await page.getByRole('button',{name:'Français',exact:true}).click();await page.getByRole('link',{name:'Commencer gratuitement',exact:true}).first().waitFor();
    await page.reload();await page.getByRole('link',{name:'Commencer gratuitement',exact:true}).first().waitFor();
    await context.close();
    const nojs=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});const staticPage=await nojs.newPage();
    for(const content of arabicSeoPages){await staticPage.goto(base+arabicPath(content.slug));assert.equal(await staticPage.locator('h1').innerText(),content.h1);assert(await staticPage.locator('p[lang="es"]').count()>0)}
    await nojs.close();
    console.log('PASS: Chromium mobile/desktop overflow, semantic RTL after hydration, screenshots, RU/FR switch persistence and all 10 pages without JS. Real Safari/iOS/Telegram/audio still require device checks.');
  } finally { await browser?.close();server?.kill('SIGTERM'); }
})().catch(e=>{console.error(e);process.exitCode=1});
