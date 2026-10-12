# Arabic SEO MVP — 2026-10-10

Baseline: main `8f4a8f6e02afb0ae935db2768ec3b004125b736a`. Branch: `feat/arabic-seo-mvp-20261010`.

## CHANGE / WHY

Add Arabic as a presentation/content locale of the existing app: ten public SEO pages and three free six-stage lessons (housing, doctor, work/documents). MSA, not Darija. Reuse the same exercise generator/runner, storage, auth and payment APIs. No database migration or additional service configuration.

The ten Arabic pages use typed content + one SSR component. Root HTML is Arabic RTL before hydration; Spanish runs are explicitly LTR. Existing numbered lessons retain their addresses, content, access rules and course progress. The root RU landing links reciprocally to /ar; no invented RU/FR topic URLs or forced language redirects.

## FILES / ARCHITECTURE

- `src/app/(main)`: original page routes moved unchanged into a route group. URLs do not change. The one relative app-page re-export and security-check source paths were updated.
- `src/app/root-shell.tsx`: original providers/scripts/metadata extracted for reuse. `(main)/layout.tsx` emits RU/LTR, `ar/layout.tsx` emits AR/RTL. Next.js supports multiple root layouts; crossing these layouts reloads the document while preserving local storage. Official reference: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups .
- `src/lib/arabic/seo-content.ts`, `metadata.ts`, `components/arabic/seo-page.tsx`: all 10 page configurations, unique metadata, visible matching FAQ schema, examples/audio, related links and lesson CTA.
- `src/lib/arabic/lessons.ts`: shared Spanish phrases with RU/FR/AR translations, stable situation IDs 1001–1003, vocabulary, dialogues, blanks and scenarios. RU/FR lesson routes for these new scenarios are not advertised or invented.
- `components/arabic/situation-trainer.tsx`: six-stage presentation; choice/fill/build/translate use the existing ExerciseRunner/generator. All three scenarios share this component.
- `src/lib/progress/{types,reducer,storage}.ts`: additive `situations` namespace inside the existing `espanol-real:progress:v1` record. Old records migrate with empty situation maps; course events retain their prior behavior. Situation answers update SRS, viewed vocabulary is recorded and completion is persisted; no false numbered-course completion, XP, certificates, course hearts or paid entitlements. Mistake review is available on the same lesson before/after completion.
- `components/trainer/{exercise-runner,flip-card}.tsx`: additive AR text, semantic bidi and opt-in situation scope. Existing default scope is the numbered course. RU/FR card advancement is tested.
- Language provider initializes from server locale, restores RU/FR selection and updates lang/dir; selectors are visible on landing/app/Arabic pages. Arabic route always wins over a saved RU/FR preference.
- `public/ar-og.png`: inspected 1200×630 Arabic sharing card. Optional regeneration: `python scripts/arabic/create-og.py` with Pillow+RAQM+DejaVu Sans; no runtime font or image library added to pages.
- Sitemap adds exactly 10 public Arabic SEO URLs. Canonicals follow the existing site's slashless route convention; requests with trailing slashes use Next's normal redirect. Arabic lesson/account pages remain noindex and outside sitemap. robots already permits /ar.

## AUTH, PAYMENT AND ANALYTICS

`/ar/account` reuses the original TelegramLogin and TelegramStarsPayment components. Changes there are Arabic presentation and confirmed client event observation only. Server signature validation, paid orders, webhook fulfillment, product catalog and database are unchanged. The Arabic account page clearly states that Premium buys the original mainly Russian course; only three Arabic lessons currently exist and are free. Do not advertise 45 Arabic lessons.

Audio uses browser speech synthesis with es-ES language/preferred voice, only after user click. Unsupported speech displays an Arabic fallback. It is not a recorded audio asset, does not guarantee an installed es-ES voice and does not guarantee offline audio.

Events: arabic_page_view, arabic_cta_click, arabic_lesson_start, arabic_lesson_complete, arabic_signup, arabic_purchase, arabic_audio_play, arabic_next_lesson. Payload: page, lesson_id (null when inapplicable), locale=ar, source. Consent-gated, bounded queue; GA4/Yandex share the existing consent mechanism. Signup denotes a confirmed guest→authenticated transition, not a count of newly created database users. Purchase is emitted only after the existing order-status API reports paid+premium, not on button click or invoice callback alone. No names, Telegram IDs, symptoms, answer text or secrets are included. Real collector delivery must be checked on staging/production.

## TEST / RESULT

Executed:
- Full typecheck, lint, Next production build and existing security regression.
- `npm run test:arabic`: unique pages, multilingual phrase reuse, shared generation, old-progress migration, storage round-trip, isolated situation SRS/completion and retained course progression.
- `npm run test:arabic:http`: starts production server; all ten HTTP 200 pages, raw HTML lang/dir/H1/metadata/schema/Spanish LTR without JS, 16 internal links, sitemap, reciprocal RU/AR, noindex app pages, 404s, original routes and anonymous Premium API denial (402).
- React DOM interaction tests for all three complete lessons, wrong-answer retry, remounted saved completion and mistake review, unavailable audio fallback, repeated RU/FR flip cards and consent-gated analytics adapters. These run under jsdom and do not prove browser layout, real audio or actual network collectors.
- Sharing card visually inspected.

Reproduce DOM tests in a QA environment with jsdom available. Optional isolated setup:
```
npm install --prefix /tmp/espanolreal-arabic-qa --no-audit --no-fund jsdom
ARABIC_QA_JSDOM=/tmp/espanolreal-arabic-qa/node_modules/jsdom npm run test:arabic:interaction
```

`npm run test:arabic:browser` is provided for Chromium widths 360/390/430/1280, screenshots, RTL after hydration, locale switching and no-JS pages. **Not executed successfully here:** no browser binary was present, and the browser download failed with an invalid/truncated archive. Do not label mobile/browser QA as passed.

## RISK / PENDING ACCEPTANCE

Draft PR, not production-ready language acceptance. Required before release:
1. A native Arabic speaker, preferably living in Spain, reviews every string in the first three lessons, visible SEO copy and account UI.
2. Real Chromium/Safari iPhone/Android layout and touch checks; run the provided browser script where a browser binary is available. Check mixed punctuation, €/%/email/URL, arrows and small-screen controls.
3. Actual es-ES speech, voice availability, autoplay restrictions, browser back and installed PWA/offline/update behavior. Existing PWA manifest/start URL and service worker retain their RU default; this MVP does not promise an Arabic offline installation entry point.
4. Signed-in web and Mini App auth, actual Stars purchase/restore and live consent/analytics collection using production/staging configuration.
5. Verify Netlify deploy preview and production performance. No CWV measurements are claimed.
6. After release: submit sitemap and inspect /ar and pillar page in Search Console. Deployment does not guarantee indexing; review actual impressions/queries after 4–8 weeks and choose Phase 2 from the data.

MSA copy is a draft for native review. No certification claims, legal eligibility claims, medication/dose recommendations or forced locale redirects are added. Existing root social-preview copy remains intact.
