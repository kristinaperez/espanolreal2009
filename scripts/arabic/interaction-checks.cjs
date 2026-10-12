/* Run with jsdom installed in your QA environment, or set ARABIC_QA_JSDOM to its module directory. */
const assert = require('node:assert/strict');
const { JSDOM } = require(process.env.ARABIC_QA_JSDOM || 'jsdom');
const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>', { url: 'https://espanolreal.es/ar/lesson/housing', pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const React = require('react'); const { act } = React; const { createRoot } = require('react-dom/client');
const { load, configure } = require('./load-module.cjs');
configure({ globals: { window, document, localStorage: window.localStorage, Event: window.Event, URLSearchParams: window.URLSearchParams }, mocks: { 'next/link': { __esModule: true, default: ({ children, href, ...props }) => React.createElement('a', { ...props, href }, children) } } });
const { SituationTrainer } = load('src/components/arabic/situation-trainer.tsx');
const { LanguageProvider } = load('src/components/providers/language-provider.tsx');
const { ProgressProvider } = load('src/components/providers/progress-provider.tsx');
const { defaultState } = load('src/lib/progress/types.ts');
const { situationLessons, localizeSituation, situationPool } = load('src/lib/arabic/lessons.ts');
const { generatePractice } = load('src/lib/exercises/generator.ts');
const { getLessonMetas } = load('src/lib/content/loader.ts');
const { trackArabicEvent, flushArabicEvents } = load('src/lib/arabic/analytics.ts');
const plain = x => JSON.parse(JSON.stringify(x));
let root;
async function settle() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 15)); }); }
function button(text) { const all = [...document.querySelectorAll('button')]; const result = all.find(b => b.textContent.trim() === text); assert(result, 'button not found: '+text+' | '+all.map(b=>b.textContent.trim()).join(',')); return result; }
async function click(node) { assert(!node.disabled, 'button unexpectedly disabled '+node.textContent); await act(async () => { node.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); await settle(); }
async function answer(exercise, wrong=false) {
  if (exercise.kind === 'choice' || exercise.kind === 'fill') {
    const answer = exercise.kind === 'choice' ? exercise.options[exercise.answerIndex] : exercise.answer;
    const target = wrong ? exercise.options.find(o => o !== answer) : answer;
    const node = [...document.querySelectorAll('button')].find(b=>b.querySelector('.leading-snug')?.textContent === target); assert(node, 'option not rendered '+target); await click(node);
  } else if (exercise.kind === 'build') {
    for (const token of exercise.answer.split(' ')) await click([...document.querySelectorAll('[lang="es"] button')].find(b=>b.textContent===token && !b.disabled && !b.className.includes('text-white')));
  } else if (exercise.kind === 'translate') {
    const input = document.querySelector('input');
    await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, exercise.answer); input.dispatchEvent(new window.Event('input', { bubbles: true })); }); await settle();
  } else throw new Error('Unexpected exercise kind '+exercise.kind);
  await click(button('تحقّق'));
  await click([...document.querySelectorAll('button')].find(b=>['التالي ←','إنهاء المرحلة'].includes(b.textContent.trim())));
}
(async () => {
  const key='espanol-real:progress:v1'; const initial=plain(defaultState()); initial.xp=123; initial.settings.sound=false; initial.settings.hearts=true; initial.hearts.count=0; delete initial.situations;
  localStorage = window.localStorage; localStorage.setItem(key, JSON.stringify(initial)); localStorage.setItem('espanolreal:analytics-consent:v1','rejected');
  for (const source of situationLessons) {
    root = createRoot(document.getElementById('root'));
    const view = React.createElement(LanguageProvider, { initialLanguage: 'ar' }, React.createElement(ProgressProvider, { metas: getLessonMetas() }, React.createElement(SituationTrainer, { source })));
    await act(async()=>root.render(view)); await settle();
    await click(button('ابدأ الدرس')); await click(button('تابع إلى الاستماع ←'));
    await click(button('استمع')); assert(document.body.textContent.includes('الصوت غير متاح'), 'unsupported speech has readable fallback');
    await click(button('تابع بالقراءة إذا تعذّر الصوت ←'));
    const lesson=localizeSituation(source,'ar'); const phrases=lesson.phrases.map((phrase,index)=>({phrase,index,lesson:source.id}));
    const choices=generatePractice(phrases,situationPool('ar'),`${source.id}-understand-0`,['choice']);
    // A wrong answer must reappear and be persisted without blocking completion.
    await answer(choices[0],true); for(const exercise of choices.slice(1)) await answer(exercise); await answer(choices[0]);
    await answer({ kind:'fill', options:source.blank.options, answer:source.blank.answer });
    await click(button('تدرّب على إجابات الحوار'));
    const dialogue=generatePractice(phrases.slice(0,4),situationPool('ar'),`${source.id}-dialogue-0`,['build','choice']);
    for(const exercise of dialogue) await answer(exercise);
    const final=generatePractice([phrases[source.scenario.phraseIndex]],situationPool('ar'),`${source.id}-real-0`,['build','translate']);
    for(const exercise of final) await answer(exercise);
    assert(document.body.textContent.includes('أكملت الدرس!'));
    let saved=JSON.parse(localStorage.getItem(key)); assert(saved.situations.lessons[String(source.id)].completed); assert(saved.situations.phrases[`${source.id}:0`].wrong>0); assert.equal(saved.xp,123); assert.deepEqual(saved.lessons,{});
    await act(async()=>root.unmount()); root=createRoot(document.getElementById('root')); await act(async()=>root.render(view)); await settle();
    assert(document.body.textContent.includes('سبق أن أكملت'), 'completion must survive remount');
    await click(button('راجع الأخطاء السابقة')); assert(document.body.textContent.includes('مراجعة الأخطاء')); await act(async()=>root.unmount());
  }
  // Same FlipCard in RU/FR still flips and advances; isolated progress disabled only when requested.
  const { ExerciseRunner }=load('src/components/trainer/exercise-runner.tsx');
  for(const locale of ['ru','fr']){
    localStorage.setItem('espanol-real:interface-language',locale);
    const fresh=plain(defaultState()); fresh.settings.sound=false; localStorage.setItem(key,JSON.stringify(fresh));
    root=createRoot(document.getElementById('root'));let result;
    const phrase={spanish:'Hola',translation:locale==='fr'?'Bonjour':'Привет'};
    const exercises=[{id:'fc1',kind:'flashcard',lesson:1,phraseIndex:0,phrase,gradable:false,reverse:false},{id:'fc2',kind:'flashcard',lesson:1,phraseIndex:1,phrase:{spanish:'Gracias',translation:locale==='fr'?'Merci':'Спасибо'},gradable:false,reverse:false}];
    await act(async()=>root.render(React.createElement(LanguageProvider,null,React.createElement(ProgressProvider,{metas:getLessonMetas()},React.createElement(ExerciseRunner,{exercises,mode:'lesson',title:'Test',onFinish:r=>{result=r}})))));await settle();
    for(let i=0;i<2;i++){await click(document.querySelector('button[aria-label="'+(locale==='fr'?'Afficher la traduction':'Показать перевод')+'"]'));await click(button(locale==='fr'?'✓ Je savais':'✓ Знал'));}
    assert(result,'RU/FR cards must complete after repeated clicks');assert.equal(JSON.parse(localStorage.getItem(key)).totals.flashcards,2);await act(async()=>root.unmount());
  }
  const sent=[];window.gtag=(...args)=>sent.push(args);window.ym=(...args)=>sent.push(args);
  localStorage.setItem('espanolreal:analytics-consent:v1','rejected');trackArabicEvent('arabic_cta_click','housing');flushArabicEvents();assert.equal(sent.length,0);
  localStorage.setItem('espanolreal:analytics-consent:v1','accepted');trackArabicEvent('arabic_lesson_complete','housing');flushArabicEvents();assert.equal(sent.length,2);assert.equal(sent[0][2].locale,'ar');
  console.log('PASS: actual React six-stage completion for 3 lessons, wrong-answer retry, audio unavailable fallback, saved-progress remount/review, unchanged course totals, RU/FR repeated flip-card advancement, consent-gated GA/Yandex events. DOM tests do not replace device/layout QA.');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>{if(root)await act(async()=>root.unmount());dom.window.close()});
