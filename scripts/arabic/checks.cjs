const assert = require('node:assert/strict');
const { load } = require('./load-module.cjs');
const { defaultState } = load('src/lib/progress/types.ts');
const { migrate } = load('src/lib/progress/storage.ts');
const { reduce } = load('src/lib/progress/reducer.ts');
const { getLessonMetas } = load('src/lib/content/loader.ts');
const { situationLessons, localizeSituation, situationPool } = load('src/lib/arabic/lessons.ts');
const { arabicSeoPages } = load('src/lib/arabic/seo-content.ts');
const { arabicMetadata } = load('src/lib/arabic/metadata.ts');
const { generatePractice } = load('src/lib/exercises/generator.ts');
const metas = getLessonMetas();
const plain = value => JSON.parse(JSON.stringify(value));
const original = plain(defaultState()); delete original.situations;
original.xp = 37; original.lessons['4'] = { completed: true, completedAt: '2026-10-09', attempts: 2, bestScore: 4, bestTotal: 5, perfect: false };
let state = migrate(original);
assert.equal(state.xp, 37); assert.equal(state.situations.cards, 0);
const originalCourse = plain(state); delete originalCourse.situations;
for (const lesson of situationLessons) {
  const localized = localizeSituation(lesson, 'ar');
  for (const locale of ['ar', 'ru', 'fr']) {
    const alternate = localizeSituation(lesson, locale);
    assert.deepEqual(plain(alternate.phrases.map(p => p.spanish)), plain(localized.phrases.map(p => p.spanish)));
    assert(alternate.phrases.every(p => p.translation.length > 0));
  }
  const phrases = localized.phrases.map((phrase, index) => ({ phrase, index, lesson: lesson.id }));
  for (const kind of ['choice', 'fill', 'build', 'translate']) {
    const exercises = generatePractice(phrases, situationPool('ar'), 'qa', [kind]);
    assert(exercises.length > 0);
    for (const ex of exercises) {
      if (ex.kind === 'choice') { assert.equal(ex.options.length, 4); assert.equal(new Set(ex.options).size, 4); assert(/[\u0600-\u06ff]/.test(ex.phrase.translation)); }
      if (ex.kind === 'fill') assert(ex.options.includes(ex.answer));
    }
  }
  state = reduce(state, { type: 'answer', lesson: lesson.id, phraseIndex: 0, correct: false, scope: 'situations' }, metas);
  state = reduce(state, { type: 'answer', lesson: lesson.id, phraseIndex: 0, correct: true, scope: 'situations' }, metas);
  state = reduce(state, { type: 'flashcard', lesson: lesson.id, phraseIndex: 0, scope: 'situations' }, metas);
  state = reduce(state, { type: 'lessonComplete', lesson: lesson.id, correct: 7, total: 8, scope: 'situations' }, metas);
  assert.equal(state.situations.phrases[`${lesson.id}:0`].wrong, 1);
  assert.equal(state.situations.phrases[`${lesson.id}:0`].learned, true);
  assert.equal(state.situations.lessons[String(lesson.id)].completed, true);
}
const afterCourse = plain(state); delete afterCourse.situations;
assert.deepEqual(afterCourse, originalCourse, 'situation progress must not modify course/certificate/statistics');
assert.deepEqual(plain(migrate(plain(state)).situations), plain(state.situations));
const courseAfter = reduce(state, { type: 'answer', lesson: 1, phraseIndex: 0, correct: true }, metas);
assert(courseAfter.xp > state.xp); assert.equal(courseAfter.phrases['1:0'].learned, true);
assert.deepEqual(plain(courseAfter.situations), plain(state.situations));
assert.equal(arabicSeoPages.length, 10);
for (const key of ['slug', 'title', 'description', 'h1']) assert.equal(new Set(arabicSeoPages.map(p => p[key])).size, 10);
for (const page of arabicSeoPages) {
  assert(situationLessons.some(l => l.slug === page.lesson));
  assert(page.phrases.length >= 3); assert(page.sections.length >= 3);
  const metadata = arabicMetadata(page);
  assert.equal(metadata.alternates.canonical, `https://espanolreal.es/ar${page.slug ? '/'+page.slug : ''}`);
  assert(!Object.keys(metadata.alternates.languages).includes('fr'));
}
console.log('PASS: 10 unique Arabic pages; 3 multilingual situation lessons; real shared exercise generation; old-progress migration/round-trip; isolated completion/SRS; RU course progression retained.');
