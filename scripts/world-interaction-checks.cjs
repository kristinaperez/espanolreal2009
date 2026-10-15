const assert = require('node:assert/strict');
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="root"></div>',{url:'https://espanolreal.es/ru/world',pretendToBeVisual:true});
global.window=dom.window;global.document=dom.window.document;
Object.defineProperty(global,'navigator',{value:window.navigator,configurable:true});
global.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');
const {load,configure}=require('./arabic/load-module.cjs');
configure({globals:{window,document,navigator,localStorage:window.localStorage,setTimeout,clearTimeout,SpeechSynthesisUtterance:class {constructor(text){this.text=text}}},mocks:{'next/link':{__esModule:true,default:({children,href,...props})=>React.createElement('a',{href,...props},children)}}});
const {WorldTrainer}=load('src/components/world/world-trainer.tsx');
const {phrases,WORLD_KEY}=load('src/lib/world/model.ts');
let root;
async function settle(){await act(async()=>{await new Promise(r=>setTimeout(r,20))})}
async function mount(){root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(WorldTrainer)));await settle()}
async function unmount(){await act(async()=>root.unmount())}
function button(text){const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);assert(b,'Missing button '+text);return b}
async function click(text){const b=button(text);assert(!b.disabled);await act(async()=>b.click());await settle()}
const text=()=>document.body.textContent;
async function input(value){await act(async()=>{const el=document.querySelector('input');Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new window.Event('input',{bubbles:true}))});await settle()}
async function submit(){await act(async()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await settle()}
(async()=>{
  window.localStorage.setItem('espanol-real:progress:v1','legacy-marker');
  await mount();
  await click('Построить первую деталь');assert.equal(window.localStorage.getItem(WORLD_KEY),null);
  await click('К своему дому');assert(text().includes('0 из 10'));
  for(let i=0;i<10;i++){
    await click(i===0?'Построить первую деталь':'Продолжить строительство');
    assert.equal(document.querySelectorAll('.world-situations > div').length,2);
    if(i===0){await click('Записать себя');assert(text().includes('Микрофон недоступен'))}
    await click('Попробовать');assert(button(phrases[i].translation).disabled);
    if(i===0){
      await click('Послушать');assert(text().includes('Озвучивание недоступно'));
      window.SpeechSynthesisUtterance=class{};
      window.speechSynthesis={cancel(){},getVoices(){return []},speak(u){u.onstart()}};
      await click('Послушать');
      await click(phrases[1].translation);assert(text().includes('Пока не совсем'));
      await click(phrases[0].translation);
      await click(phrases[1].spanish);assert(text().includes('Попробуй другой ответ'));
      assert(!JSON.parse(window.localStorage.getItem(WORLD_KEY)).phrases[phrases[0].id].respond);
    }else await click('Продолжить без аудио');
    await click(phrases[i].spanish);assert(text().includes('Ещё одна деталь — твоя!'));
    if(i===0){
      await click('Вспомнить без подсказки');await input('неверно');await submit();assert(text().includes('Пока не совпало'));
      await input('me cuentas');await submit();assert(text().includes('Получилось! Ты вспомнил'));
      await click('К своему дому');
    }else await click('Посмотреть свой дом');
    assert(text().includes(`${i+1} из 10`));
    await unmount();await mount();assert(text().includes(`${i+1} из 10`));
  }
  assert(text().includes('Дом построен!'));assert.equal(document.querySelectorAll('[data-built="true"]').length,10);
  const state=JSON.parse(window.localStorage.getItem(WORLD_KEY));assert(state.phrases['world-01'].recognize);assert(state.phrases['world-01'].recall);assert.equal(state.phrases['world-02'].recognize,false);
  assert.equal(window.localStorage.getItem('espanol-real:progress:v1'),'legacy-marker');
  await click('Повторить фразы');await click('Попробовать');await click('Продолжить без аудио');await click(phrases[0].spanish);await click('Посмотреть свой дом');assert(text().includes('10 из 10'));
  await unmount();window.localStorage.setItem(WORLD_KEY,'corrupt');await mount();assert(text().includes('0 из 10'));await unmount();
  const proto=Object.getPrototypeOf(window.localStorage),get=proto.getItem,set=proto.setItem;
  proto.getItem=()=>{throw new Error('blocked')};proto.setItem=()=>{throw new Error('blocked')};
  await mount();assert(text().includes('Браузер не даёт сохранить'));await click('Построить первую деталь');await click('Попробовать');await click('Продолжить без аудио');await click(phrases[0].spanish);await click('Посмотреть свой дом');assert(text().includes('1 из 10'));
  await unmount();proto.getItem=get;proto.setItem=set;
  let stops=0,plays=0;
  class Recorder {
    state='inactive';mimeType='audio/webm';
    start(){this.state='recording'}
    stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['test audio'])});this.onstop?.()}
  }
  class Audio {
    state='running';destination={};
    async resume(){} async decodeAudioData(){return {}} async close(){this.state='closed'}
    createBufferSource(){return {connect(){},start(){plays++;this.onended?.()}}}
  }
  Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>({getTracks:()=>[{stop(){stops++}}]})},configurable:true});
  configure({globals:{window,document,navigator,Blob,MediaRecorder:Recorder,AudioContext:Audio,setTimeout,clearTimeout}});
  const {VoicePractice}=load('src/components/world/voice-practice.tsx');
  root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(VoicePractice)));await settle();
  await click('Записать себя');await click('Остановить запись');assert.equal(stops,1);
  await click('Послушать свою запись');assert.equal(plays,1);assert(text().includes('не отправляется на сервер'));
  await click('Записать себя');await unmount();assert(stops>=2,'microphone released on unmount');
  console.log('PASS: actual React ten-step completion, no opening reward, retries, controlled audio events, unavailable mic/audio, recall, remount persistence, no duplicated rewards, legacy isolation, corrupt/blocked storage. Layout and real audio not verified.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{try{await unmount()}catch{}dom.window.close()});
