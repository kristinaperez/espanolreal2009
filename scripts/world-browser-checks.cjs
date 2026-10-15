const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { phrases } = require('../src/lib/world/phrases.json').reduce((a,p,i)=>{if(i<10)a.phrases.push(p);return a;},{phrases:[]});
const base=process.env.WORLD_QA_BASE || 'http://127.0.0.1:3100';
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({serviceWorkers:'block'});
    await context.route('https://**/*',r=>r.abort());
    await context.addInitScript(()=>{
      localStorage.setItem('espanolreal:analytics-consent:v1','rejected');
      // Controlled audio callbacks test the flow, not speaker/device audio.
      Object.defineProperty(window,'speechSynthesis',{value:{cancel(){},getVoices(){return []},speak(u){u.onstart?.()}}});
    });
    const page=await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/ru/world');
    await page.getByRole('heading',{level:1,name:'Построй свой мир на испанском'}).waitFor();
    const old=await page.evaluate(()=>localStorage.getItem('espanol-real:progress:v1'));
    for(const width of [320,390,768,1280]){
      await page.setViewportSize({width,height:900});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`home overflow ${width}`);
    }
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'/tmp/world-home.png',fullPage:true});
    for(let i=0;i<phrases.length;i++){
      const p=phrases[i];
      await page.getByRole('button',{name:i===0?'Построить первую деталь':'Продолжить строительство',exact:true}).click();
      await page.getByRole('heading',{name:'Одна фраза. Уже можно сказать.'}).waitFor();
      if(i===0){
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('espanolreal:world:v1')||'{"phrases":{}}').phrases['world-01']?.respond),undefined);
        await page.getByRole('button',{name:'К своему дому',exact:true}).click();
        await page.getByTestId('world-count').filter({hasText:'0 из 10'}).waitFor();
        await page.getByRole('button',{name:'Построить первую деталь'}).click();
        await page.screenshot({path:'/tmp/world-phrase.png',fullPage:true});
      }
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.getByRole('button',{name:'Попробовать',exact:true}).click();
      if(i===0){
        assert(await page.getByRole('button',{name:p.translation,exact:true}).isDisabled());
        await page.getByRole('button',{name:'Послушать',exact:true}).click();
        const wrong=phrases.find(x=>x.id!==p.id);
        await page.getByRole('button',{name:wrong.translation,exact:true}).click();
        await page.getByText('Пока не совсем.',{exact:false}).waitFor();
        await page.getByRole('button',{name:p.translation,exact:true}).click();
      }else await page.getByRole('button',{name:'Продолжить без аудио'}).click();
      await page.getByRole('button',{name:p.spanish,exact:true}).click();
      await page.getByRole('heading',{name:'Ещё одна деталь — твоя!'}).waitFor();
      if(i===0){
        await page.getByRole('button',{name:'Вспомнить без подсказки'}).click();
        await page.getByLabel('Твой ответ',{exact:true}).fill('не тот ответ');
        await page.getByRole('button',{name:'Проверить',exact:true}).click();
        await page.getByText('Пока не совпало.',{exact:false}).waitFor();
        await page.getByLabel('Твой ответ',{exact:true}).fill(p.spanish);
        await page.getByRole('button',{name:'Проверить',exact:true}).click();
        await page.getByText('Получилось! Ты вспомнил',{exact:false}).waitFor();
        await page.getByRole('button',{name:'К своему дому',exact:true}).last().click();
      }else await page.getByRole('button',{name:'Посмотреть свой дом'}).click();
      await page.getByTestId('world-count').filter({hasText:`${i+1} из 10`}).waitFor();
      await page.reload();
      await page.getByTestId('world-count').filter({hasText:`${i+1} из 10`}).waitFor();
    }
    await page.getByRole('heading',{name:'Дом построен!',exact:true}).waitFor();
    assert.equal(await page.locator('[data-built="true"]').count(),10);
    await page.screenshot({path:'/tmp/world-complete.png',fullPage:true});
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('espanolreal:world:v1')));
    assert(state.phrases['world-01'].recognize && state.phrases['world-01'].recall);
    assert.equal(state.phrases['world-02'].recognize,false,'skipping audio is not recognition');
    assert.equal(await page.evaluate(()=>localStorage.getItem('espanol-real:progress:v1')),old,'legacy progress unchanged');
    await page.getByRole('button',{name:'Повторить фразы',exact:true}).click();
    await page.getByRole('button',{name:'Попробовать',exact:true}).click();
    await page.getByRole('button',{name:'Продолжить без аудио'}).click();
    await page.getByRole('button',{name:phrases[0].spanish,exact:true}).click();
    await page.getByRole('button',{name:'Посмотреть свой дом'}).click();
    await page.getByTestId('world-count').filter({hasText:'10 из 10'}).waitFor();
    assert(await page.locator('meta[name="robots"]').getAttribute('content').then(v=>v.includes('noindex')));
    await page.evaluate(()=>localStorage.setItem('espanolreal:world:v1','broken'));
    await page.reload();await page.getByTestId('world-count').filter({hasText:'0 из 10'}).waitFor();
    const blocked=await browser.newContext({serviceWorkers:'block'});
    await blocked.route('https://**/*',r=>r.abort());
    await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('blocked')};Storage.prototype.setItem=()=>{throw new Error('blocked')};});
    const blockedPage=await blocked.newPage();await blockedPage.goto(base+'/ru/world');
    await blockedPage.getByRole('alert').filter({hasText:'Браузер не даёт сохранить'}).waitFor();
    await blockedPage.getByRole('button',{name:'Построить первую деталь'}).click();
    await blockedPage.getByRole('button',{name:'Попробовать',exact:true}).click();
    await blockedPage.getByRole('button',{name:'Продолжить без аудио'}).click();
    await blockedPage.getByRole('button',{name:phrases[0].spanish,exact:true}).click();
    await blockedPage.getByRole('button',{name:'Посмотреть свой дом'}).click();
    await blockedPage.getByTestId('world-count').filter({hasText:'1 из 10'}).waitFor();
    assert.deepEqual(errors,[]);
    console.log('PASS: 10 steps, wrong answers, audio gating (mocked), recall, reload, repeat, noindex, corrupt/blocked storage, legacy isolation, 320–1280px and screenshots.');
    await blocked.close();await context.close();
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
