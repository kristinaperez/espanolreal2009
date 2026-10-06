# Mobile sharing acceptance, 2026-10-05

CHANGE / WHY / FILES / RISK / TEST / RESULT

- UI: remove visual concept/search text, public snapshot implementation hint and duplicated dashboard CTA; hide header/course language selectors and reset the interface to Russian (translations retained for future settings). Upload status replaces native empty-file label, allowing repeat selection of the same file. Share icons use brand color with hover shadow. Files: visual-hook, meme-picker, teacher-dashboard/generator, header-nav-update, app-shell, language-provider, share-button.
- Mini App: correct bot-token HMAC canonicalization to include `signature`; only `hash` is excluded. The previous helper excluded both fields, incorrectly mixing HMAC with third-party Ed25519 canonicalization. Widget path kept unchanged. Authenticity, timing-safe comparison and expiry remain enforced. File: telegram/crypto.ts. Official protocol: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app ; reference producer https://github.com/Telegram-Mini-Apps/init-data-golang/blob/master/validate.go . Synthetic protocol tests accept both legacy and signature-bearing payloads and reject tampering, stale/future timestamps and another bot's key. Real iPhone bot launch still requires acceptance after deployment.
- Browser login: standard Telegram widget may request phone verification; the website cannot read a signed-in native Telegram account. An optional “Открыть приложение в Telegram” link launches the already configured bot's main Mini App. It does not transfer a Mini App cookie to Safari. No credentials, bot token or initData logs collected.
- Telegram: share URL now includes public post URL plus title, not thousands of encoded Cyrillic characters. Diagnostic GET: short request 110 bytes HTTP200, old full-text pattern 11,424 bytes HTTP414. User's HTTP400 was not reproduced exactly; the oversized-request failure was. A full post remains on the public page and in copy/download export.
- Mobile icons: Telegram, Facebook, VK, WhatsApp, MAX, Pinterest open their link composer; Telegram asks the user to choose a chat/channel. Main Share remains prepared file + caption; Instagram and mobile Threads remain native file sharing. Native Web Share cannot select Instagram, reorder iOS suggestions, enumerate user's communities or prevent Instagram/Facebook account-side crossposting. WhatsApp icon no longer supplies a file, avoiding the reported file rejection; actual community acceptance remains device-side QA.
- Threads/Pinterest: lossless, grapheme-safe text splitting, numbered copy panels and full TXT export. Threads parts fit within 500 UTF-16 units including numbering/link, Pinterest 800; conservative room reserved. Original text reconstructed exactly in tests, including emoji and paragraph whitespace. Threads “open” creates a new composer, not an automatic reply; paste subsequent parts as replies to create a chain. Automatic authenticated thread publishing requires a separate OAuth/API integration and is outside this fix. Pinterest first description fits the platform cap; whole post is linked and rest offered as text parts. No silent tail deletion from export. References: https://core.telegram.org/widgets/share ; https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share ; https://help.pinterest.com/en/article/review-pin-specs ; https://about.fb.com/news/2023/07/introducing-threads-new-app-text-sharing/ .
- Publication CTA renamed “Опубликовать тренажёр на сайте” with explanation: it saves the existing interactive post page, not social publishing. Existing TeacherLesson/course XP/SRS, payments and DB schema unchanged.
- Download attaches the anchor to the document and keeps its Blob URL alive 30 seconds; first copy-link now attempts clipboard copy after successful publication with manual fallback.

## AI generation

The Responses API adapter already exists in src/server/teacher-posts/generate.ts. A guest always receives the mock; a signed-in user receives the mock when OPENAI_API_KEY or TEACHER_POST_AI_MODEL is absent. Mock status is now plain “Тестовый пост по шаблону. Это не индивидуальная AI-генерация.” Existing strict JSON/schema prompt builds source-based 4C stories and varied challenges rather than one generic quiz.

To enable production AI: Netlify → project espanolreal → Project configuration → Environment variables → add server-only OPENAI_API_KEY and TEACHER_POST_AI_MODEL (a model available to the project's API account with Responses + Structured Outputs). Apply to production/functions, redeploy, log in on espanolreal.es and generate a fresh post. Success indicator: “Создано с AI”, non-template source-specific content. Never put the key in NEXT_PUBLIC_* or chat. API account/provider billing is separate from ChatGPT subscription. Existing errors do not silently pretend to be AI. Netlify configuration access was unavailable in this session, so AI was not enabled or live-tested.

## Manual acceptance (pending)

- [ ] iPhone: close/reopen EspanolReal_bot main Mini App, automatic verified login without phone; ordinary Safari widget and alternative bot link.
- [ ] espanolreal.es /teacher: one visible Create post CTA, no language switch; French stored preference resets to Russian.
- [ ] Generate without lesson CTA; select own file twice, own-image status replaces empty label; remove/restore meme.
- [ ] Windows Telegram: chat/channel chooser, no HTTP400, specific post link/card.
- [ ] iOS Telegram: icon opens Telegram chooser rather than direct recent Saved Messages suggestion.
- [ ] iOS Instagram: choose app in native menu; paste copied caption. Facebook crossposting checked in Instagram settings.
- [ ] Threads: full source preserved across parts, first image + first caption, subsequent parts pasted as replies.
- [ ] Android WhatsApp community: icon link/text share succeeds with no file payload; main-file-share fallback download/copy tested separately.
- [ ] Pinterest: appropriate image and description <=800; linked post contains all content, further parts/full TXT available.
- [ ] Real authorized Netlify publication/storage and AI generation. Server secrets/real sessions not substituted by mocks.

Automated results are recorded in PR; live installed applications are not marked passed by browser stubs.

## Automated result

Full lint, tsc --noEmit and production build passed. Existing persisted Turbopack cache caused an initial panic; clean-cache rebuild passed without compiler/config changes. Protocol checks, share/storage/Sharp checks, security and teacher-post model suites passed. Chromium: network-specific mobile and desktop intents; prepared file/caption gesture and cancellation; image/TXT downloads; long-post parts; Russian-only hydration reset; own-file status and no search notes; 4C exercises; editor/draft restore; responsive 320–1440; exact student progress preservation; initial SSR OG/media. Session/publication and native-share responses were controlled in sharing tests. No real iOS/Android runtime, live AI calls or production authorization/storage writes were tested.
