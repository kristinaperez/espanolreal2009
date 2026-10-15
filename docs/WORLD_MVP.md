# EspañolReal 2.0 — World MVP

## Scope and decisions

User-approved implementation: isolated Russian `/ru/world`, ten phrases, house in ten steps. No merge to main without explicit approval. First goal is to speak: no tú/usted distinctions or formal-context gate. Existing numbered course, auth, payment, data, sitemap and stored progress contracts are untouched.

Two models were considered: (A) completed house at ten phrases and surroundings by thirty; (B) house built across all thirty phrases. A is implemented because it gives a complete visible milestone inside the MVP. Earlier success is a product hypothesis, not a measured learning effect. Expansion through phrases 11–30 and a street at 31–50 is not implemented.

## Screens and learning

World screen: outline, next construction reward, one continue button, ten short steps and completed-house state. Phrase screen: Spanish/Russian, speech synthesis, optional local recording/replay, two bilingual dialogues, listening meaning choice, response choice, permanent reward, optional unaided written recall. No punishment, streak requirement or house decay.

House elements: foundation, walls, roof, door, left window, right window, steps, porch, lit windows, home plaque. SVG is code-native, responsive, accessible by text and respects reduced motion. Every response success adds exactly one element. Opening a card, recording audio or listening alone does not build. Repeating never duplicates a reward.

Skill wording is deliberately limited to evidence: listening recognition, selecting a response and recalling the specific expression in training. Only the first of the two example situations is exercised. The second is illustrative and explicitly unverified. No claim of fully mastering a situation or independent real-life speech. Recall ignores accents, punctuation, case and extra whitespace; alternative phrasings are outside this exercise's evaluator.

## Architecture and reuse

- `src/app/(main)/ru/world/page.tsx`: isolated noindex route with own canonical, outside the legacy trainer AppShell. No sitemap entry.
- `src/app/(main)/ru/world/world.css`: scoped mobile-first layout; 44px targets, keyboard outlines, fluid type, two-column mobile steps/five-column desktop, reduced-motion behavior.
- `src/components/world/world-trainer.tsx`: page organism and phrase template. No legacy progress dispatch.
- `src/components/world/house.tsx`: SVG organism and ten geometry groups. Existing semantic palette, no new color constants.
- `src/components/world/voice-practice.tsx`: optional recording molecule. Tracks stop after 12 seconds or unmount; encoded recording remains in memory and is decoded with Web Audio, without relaxing the site's CSP.
- `src/lib/world/model.ts`: pure progress transitions, parsing, strict boolean validation, answer normalization. Stable IDs independent of numbered lesson progress.
- `src/lib/world/phrases.json`: thirty candidate phrases, source pointers and reasons; first ten have two complete situation dialogues and rewards.
- Existing `Button`, `Card`, `Badge`, `Input`, typography and semantic tokens are reused. Existing exercise runner is not reused because it dispatches to course progress. Browser speech API follows existing audio-button behavior without importing Arabic labels or analytics.

Storage key: `espanolreal:world:v1`, versioned and independent of `espanol-real:progress:v1`. Progress survives reload in the same browser; no account/device sync is claimed. Blocked/full storage shows an explicit session-only warning and exercises remain usable. Malformed JSON resets only world state. Sequential navigation prevents skipping to later construction rewards. Positive state is merged before a save; exact simultaneous multi-tab writes remain subject to localStorage's lack of atomic updates.

The inherited root providers still hydrate/save the legacy state as before. World itself does not consume or dispatch to it. The prototype's ten phrases are intentionally accessible without sign-in; it adds no payment entitlement and does not expose the old full course API. Future access policy needs a separate product decision.

Azure is not used: its existing endpoint is restricted to its current phrase registry and authentication. Browser recording does not claim automatic assessment. Real speech voices, microphones, Safari, installed PWA and Telegram WebView need device acceptance.

## First thirty candidates

These are editorial candidates selected for utility and manageable length, not corpus-verified frequency rankings. First ten are implemented; later twenty are a proposal, not released lessons. The source course remains unchanged.

| # | Phrase | Meaning | Why | Source |
| --- | --- | --- | --- | --- |
| 1 | Me cuentas | Расскажешь мне | Позволяет попросить рассказать подробнее и начать обмен репликами. | Lesson 1, phrase 1 |
| 2 | No entiendo | Я не понимаю | Позволяет остановить непонятное объяснение в любой бытовой ситуации. | Lesson 3, phrase 1 |
| 3 | ¿Puede repetir, por favor? | Повторите, пожалуйста | Помогает получить вторую попытку услышать ответ. | Lesson 3, phrase 2 |
| 4 | Más despacio, por favor | Помедленнее, пожалуйста | Позволяет самому регулировать темп разговора. | Lesson 3, phrase 3 |
| 5 | Vale | Ок, ладно, хорошо | Даёт короткий ответ согласия на предложение или инструкцию. | Lesson 42, phrase 3 |
| 6 | No pasa nada | Ничего страшного / всё в порядке | Позволяет отреагировать на извинение и поддержать разговор. | Lesson 1, phrase 8 |
| 7 | ¿Me lo puede escribir? | Можете это написать? | Помогает перенести непонятный адрес, время или инструкцию в текст. | Lesson 3, phrase 7 |
| 8 | ¿Qué significa esto? | Что это значит? | Позволяет спросить значение слова на вывеске, в форме или в объяснении. | Lesson 3, phrase 8 |
| 9 | Gracias por la ayuda | Спасибо за помощь | Позволяет завершить просьбу о помощи благодарностью. | Lesson 30, phrase 8 |
| 10 | Estoy aprendiendo español | Я учу испанский | Позволяет объяснить собеседнику свой уровень без длинной речи. | Lesson 3, phrase 5 |
| 11 | Buenos días | Добрый день (до обеда) | Начинает разговор в магазине, учреждении и с соседями. | Lesson 2, phrase 3 |
| 12 | ¿Qué tal? | Как дела? | Даёт простой способ начать знакомый разговор. | Lesson 2, phrase 1 |
| 13 | ¿Cómo te llamas? | Как тебя зовут? | Позволяет узнать имя нового знакомого. | Lesson 2, phrase 6 |
| 14 | Mucho gusto | Очень приятно | Поддерживает знакомство короткой ответной репликой. | Lesson 2, phrase 5 |
| 15 | Hasta luego | До встречи / пока | Помогает закончить повседневный разговор. | Lesson 2, phrase 4 |
| 16 | ¿Cómo se dice...? | Как говорится / как сказать...? | Позволяет спросить недостающее испанское слово. | Lesson 3, phrase 4 |
| 17 | ¿Habla inglés? | Вы говорите по-английски? | Помогает найти запасной язык общения. | Lesson 3, phrase 6 |
| 18 | ¿Me lo puede explicar despacio? | Можете объяснить медленно? | Позволяет попросить медленное объяснение. | Lesson 34, phrase 7 |
| 19 | ¿Cuánto es todo? | Сколько всего? | Позволяет узнать итоговую сумму покупки или услуги. | Lesson 16, phrase 6 |
| 20 | ¿Puedo pagar con tarjeta? | Можно картой? | Помогает уточнить способ оплаты в магазине или кафе. | Lesson 11, phrase 2 |
| 21 | ¿Dónde está la salida? | Где выход? | Позволяет найти выход в учреждении или на станции. | Lesson 18, phrase 5 |
| 22 | ¿Va al centro? | Он идёт в центр? | Позволяет проверить направление транспорта. | Lesson 17, phrase 2 |
| 23 | Un billete, por favor | Один билет, пожалуйста | Позволяет коротко попросить билет. | Lesson 17, phrase 1 |
| 24 | Quiero pedir cita | Я хочу записаться на приём | Позволяет начать запись на приём или услугу. | Lesson 21, phrase 1 |
| 25 | Tengo cita a las diez | У меня запись на десять | Позволяет сообщить время своей записи на приём. | Lesson 29, phrase 3 |
| 26 | ¿Qué documentos tengo que traer? | Какие документы мне нужно принести? | Позволяет уточнить необходимые документы до визита. | Lesson 24, phrase 2 |
| 27 | Necesito ayuda con los papeles | Мне нужна помощь с документами | Позволяет сформулировать запрос на помощь с документами. | Lesson 34, phrase 1 |
| 28 | Tengo experiencia | У меня есть опыт | Позволяет начать разговор о своей работе и навыках. | Lesson 35, phrase 5 |
| 29 | Estoy disponible | Я доступен / могу работать | Позволяет сообщить готовность к работе или встрече. | Lesson 36, phrase 4 |
| 30 | Nos vemos | Увидимся | Позволяет закончить разговор с намерением встретиться снова. | Lesson 2, phrase 8 |

## Design evidence

Applied repository design-system, frontend-audit and responsive skills. Memi CLI verified as 2.8.0-beta.2. Ran frontend brief and diagnose before edits, and diagnose after implementation. Repository score 86 → 86 across 192 files after additions; all eight scored categories assessed, static Tailwind coverage partial. This is static source evidence, not pixel verification or a guarantee of usability. Existing global palette/typography findings remain outside scope. No screenshots were produced because Chromium installation returned truncated/non-ZIP downloads in this environment.

## Change record

CHANGE: independent ten-step world prototype and thirty-phrase candidate catalog.
WHY: give beginning learners a small attainable goal with visible permanent progress.
FILES: world route/styles, world components/model/catalog, world QA scripts, this document, CHANGELOG and ROADMAP.
RISK: browser speech/recording compatibility, learning suitability of distractors and examples, local-only persistence, inherited root providers and intentional free prototype content.
TEST/RESULT: see validation below; no production credentials, database migration or live payment/auth changes.

## Validation

- PASS: `node scripts/world-checks.cjs` — 30 exact source mappings, 20 complete dialogues, strict saved-state parsing, one-time construction rewards, all ten completion transitions, recall normalization.
- PASS: `node scripts/world-interaction-checks.cjs` — actual React ten-step journey, no reward on opening, wrong answers, controlled speech callbacks, unavailable speech/microphone, written recall, remount persistence, repeat rewards, blocked/corrupt storage, legacy key isolation, mocked recording/replay and microphone release.
- PASS: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:security`.
- PASS: `node scripts/arabic/interaction-checks.cjs` and `node scripts/arabic/checks.cjs` — existing Arabic lesson interaction/data and RU/FR card regression checks.
- PASS: `node scripts/world-http-checks.cjs` — world, home, learn, first numbered lesson, Arabic landing and sitemap return HTTP 200; world has noindex/own canonical and is absent from sitemap.
- NOT RUN: `node scripts/world-browser-checks.cjs` — requires a working Playwright Chromium. It covers 320/390/768/1280px overflow, journey and screenshots. Real speaker/microphone/Safari/Telegram checks remain manual even when that script passes; it mocks speech callbacks.

## Device acceptance before merging

Open the Netlify PR preview at `/ru/world` on a phone and desktop. Complete one step, refresh and verify its house element remains. Try an incorrect answer. Try speech and optional record/replay; deny microphone access and continue. Finish ten steps, repeat one and verify the count remains ten. Confirm the numbered course retains its previous progress. Confirm no horizontal overflow at 320px, keyboard focus, dark theme and reduced motion. This is a check of the build, not a requirement to understand grammar or formality.
