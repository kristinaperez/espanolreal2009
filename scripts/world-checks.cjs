const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load } = require('./arabic/load-module.cjs');
const { phrases, emptyWorld, parseWorld, recordSuccess, builtCount, matchesPhrase } = load('src/lib/world/model.ts');
const catalog = require('../src/lib/world/phrases.json');
assert.equal(catalog.length, 30);
assert.equal(new Set(catalog.map(p=>p.id)).size,30);
for(const phrase of catalog){
  const lesson=JSON.parse(fs.readFileSync(`data/lessons/lesson${String(phrase.source.lesson).padStart(3,'0')}.json`));
  assert.equal(lesson.phrases[phrase.source.index].spanish,phrase.spanish);
  if(phrases.some(p=>p.id===phrase.id)){
    assert.equal(phrase.situations.length,2);
    for(const s of phrase.situations) for(const field of ['id','title','cue','cueTranslation','reply','replyTranslation']) assert(s[field]);
  }
}
assert.equal(builtCount(parseWorld('{broken')),0);
assert.equal(builtCount(parseWorld('{"version":99,"phrases":{}}')),0);
assert.equal(builtCount(parseWorld('{"version":1,"phrases":{"world-01":{"respond":"true"},"unknown":{"respond":true}}}')),0);
let state=emptyWorld();
state=recordSuccess(state,phrases[0].id,'recognize');
assert.equal(builtCount(state),0,'recognition alone must not build');
state=recordSuccess(state,phrases[0].id,'recall');
assert.equal(builtCount(state),0,'recall alone must not build');
state=recordSuccess(state,phrases[0].id,'respond');
state=recordSuccess(state,phrases[0].id,'respond');
assert.equal(builtCount(state),1,'repeat does not duplicate rewards');
assert(state.phrases[phrases[0].id].recognize,'positive evidence preserved');
assert.equal(builtCount(recordSuccess(state,'unknown','respond')),1);
for(const p of phrases) state=recordSuccess(state,p.id,'respond');
assert.equal(builtCount(parseWorld(JSON.stringify(state))),10);
assert(matchesPhrase('puede repetir por favor','¿Puede repetir, por favor?'));
assert(matchesPhrase('QUE SIGNIFICA ESTO','¿Qué significa esto?'));
assert(!matchesPhrase('no pasa','No pasa nada'));
console.log('PASS: 30 source mappings, 20 complete situations, isolated progress, corrupt storage, one-time rewards, persistence and answer normalization.');
