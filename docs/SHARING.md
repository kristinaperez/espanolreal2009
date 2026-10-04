# Post sharing: architecture and acceptance

App Router, Tailwind, existing RU/FR LanguageProvider. No social profile URLs or OAuth scopes are required. Previously only WhatsApp had an unconditional text intent; Telegram needed an already published URL, other buttons used native text share/copy. No image File was transmitted.

## Icons (separate commit)

react-icons 5.7.0 `si` contains all eight exports: SiTelegram, SiInstagram, SiThreads, SiFacebook, **SiMax** (MAX messenger, not SiHbomax), SiVk, SiWhatsapp, SiPinterest. MIT React wrapper; underlying Simple Icons CC0-1.0. Sources: https://github.com/react-icons/react-icons and https://github.com/simple-icons/simple-icons . MAX identity cross-checked with https://max.ru/favicon.svg and official brandbook https://go.max.ru/brandbook . No third-party SVG fallback needed. Shared config/ShareButton, 24px artwork, 48px targets, neutral/brand hover, focus outline, RU/FR aria-label/title.

## File sharing

`lib/post-image.ts` prepares a 1200-square JPEG asynchronously after generation/edit/selection. The file includes the selected original meme or teacher raster, title and caption. No-meme choice uses a typography cover, without adding a meme. GIF URLs use a static frame. Browser CORS is required for remote images; failures are explicit and file upload remains available. No unsafe server-side remote URL fetch is added.

`lib/share.ts` checks canShare(files). Clipboard write starts first, but is deliberately **not awaited before navigator.share**: awaiting permission may lose Safari user activation. The already prepared File is passed synchronously in the click stack. Clipboard success announces caption insertion; failure offers manual copy. AbortError is normal. On mobile/touch all icons invoke the same system sheet; the site cannot force Instagram or another particular app to receive it. Unsupported file share uses download/copy controls. Desktop Instagram downloads the actual prepared JPEG and copies the caption, with a manual-upload hint.

## Public snapshots and OG

POST `/api/teacher/posts/share`: same-origin check, verified existing Telegram user, rate limit, bounded JSON/raster, Sharp decode/pixel limits. Netlify Blobs site-wide namespaces separate production from preview/branch contexts. The stored snapshot contains the post, server-resolved CTA, author display name, permanent image URLs, timestamp and UUIDv4 ID. No student XP/SRS or payment writes; no new PostgreSQL migration. Two JPEGs are stored **before** the JSON becomes readable. Failed writes clean up. Published content never updates; every edit creates a new ID. Public visual points at the stored immutable raster, even if the original external image later changes.

`/p/[id]` uses server rendering + generateMetadata. OG title/description/image/width/height/url/type and Twitter large-image card are specific to that snapshot. htmlLimitedBots forces metadata into initial HTML for all user agents. `/media/posts/[id]/og.jpg` and `pin.jpg` serve public, immutable raster bytes without auth. robots permits /p and /media; /api remains disallowed. No middleware or Cloudflare code is configured in this repository. External host bot protection cannot be inferred from source.

Original image is fitted in 1200×630 OG and 1000×1500 Pinterest (2:3), with light padding **without cropping**. Download/file-share keeps square 1200×1200. If edge-to-edge composition is preferred, add a separate cover editor; automatic crop would risk removing meme text.

First desktop icon click reserves a blank popup synchronously, then uploads and navigates that window to the network intent. Subsequent clicks open the ready intent immediately. Popup failure is explained. Copy-link first creates a snapshot, then tries clipboard; denied clipboard offers a selectable URL. Desktop link sharing does not upload the image into the user's feed directly; crawlers use OG.

## Retention/cleanup

Production published snapshots and images remain indefinitely, to preserve shared URLs. No automatic production expiry. Preview snapshots expire after 30 days; daily `netlify/functions/cleanup-share.mts` removes expired preview JSON/media and unreferenced media older than 24h. Partial writes are cleaned immediately. Store scope isolates preview cleanup from production. Scheduled Functions execute on the published production deploy; preview cleanup is therefore active after merge/deploy, not on the PR preview. Counts only are returned. Operational storage consumption should be monitored; user-facing deletion/retention changes are a future explicit product decision.

## Official references, checked 2026-10-04

- Telegram: https://core.telegram.org/widgets/share (url/text).
- WhatsApp: https://faq.whatsapp.com/5913398998672934 (wa.me click-to-chat).
- Facebook: https://developers.facebook.com/documentation/plugins/share-button and https://developers.facebook.com/documentation/sharing/web . Facebook takes a link and scraper metadata, not arbitrary injected image/title parameters.
- Pinterest: https://developer.pinterest.com/docs/web-features/buttons/ (url/media/description).
- MAX: https://dev.max.ru/help/deeplinks documents https://max.ru/:share?text= with URL encoding. This is a client deep link; app availability/version still matters.
- Threads: https://developers.facebook.com/documentation/threads/threads-web-intents ; VK: https://dev.vk.com/ru/widgets/share . These official endpoints were inaccessible to the retrieval tool in this session. Requested web intents are implemented; official-document verification of those two and real account-side composition remains pending. threads.net may redirect to threads.com.
- Web Share: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share . HTTPS, transient user activation and file support are required.
- Storage: https://docs.netlify.com/build/data-and-storage/netlify-blobs/ ; Next integration https://nextjs-platform-starter.netlify.app/blobs . Runtime credentials are injected by Netlify; no frontend keys.

No blanket guarantee is made that noindex is ignored by every scraper. Published page explicitly indexes/follows. The preview host may add its own X-Robots-Tag; inspect deployment response headers. Existing `/teacher/posts/view` remains legacy/noindex and is not used by the new desktop share buttons.

## Manual checklist (unverified items must stay unchecked)

- [ ] Android Chrome over preview HTTPS: generate, wait for prepared image, tap main Share and each icon; choose installed target; verify image, paste copied caption if absent; cancel normally.
- [ ] iPhone Safari HTTPS: same checks, verify File share after clipboard call and no user-activation error. Test camera/library JPG/PNG, GIF link, denied clipboard and popup permission.
- [ ] Desktop Chrome: verified Telegram login → each icon. First click creates snapshot and navigates reserved popup; subsequent clicks use same URL. Facebook/TG/VK show specific post image; Pinterest uses vertical media. Threads/MAX prefill text/link. Instagram downloads JPEG and copies text.
- [ ] Open Copy-link in a private browser without login; check post and raster return 200. Edit post and share: new UUID/URL, old URL unchanged.
- [ ] Facebook Sharing Debugger https://developers.facebook.com/tools/debug/ : paste preview URL, Fetch new information, check specific og:image, title, canonical and image dimensions.
- [ ] Telegram: send link to Saved Messages and inspect preview. Posting to this account requires its signed-in session; not performed by unattended tests.
- [ ] opengraph.xyz: paste preview public URL, verify crawler sees OG. Verify no platform challenge/auth wall.
- [ ] With another generated post, verify image URL differs. Re-share existing URL: cached image remains valid; new revision gets fresh URL.
- [ ] Monitor Blobs and scheduled cleanup after production deployment; confirm preview expiry, production retention, no secrets in response.

## Automated checks

`npm run lint`, `npm run typecheck`, `npm run build`, `node scripts/share-checks.mjs`, security and teacher model checks. `e2e-share.cjs` uses controlled navigator/share, auth and publication responses for file payloads, user gesture call ordering, eight icons, intents, cancellation, downloads, edit invalidation, RU/FR persistence, widths 320–1280 and unchanged course storage. The blob adapter is an in-memory test double with real Sharp processing. Actual authenticated Netlify writes and installed mobile apps require manual acceptance; mock success is not that evidence.

Read-only fictional crawler fixture `/p/bc92ec90-8897-43be-bd92-94419ffae82c` exists only on deploy previews, never grants write/auth capability. It is separate from real stored posts and permits preview HTML/media QA without sharing a user's content. Production ignores this fixture.

## Preview evidence (2026-10-04)

PR #6 Netlify deploy status: success, https://deploy-preview-6--espanolreal.netlify.app . Anonymous GET of the fictional /p page returned **401**. The cloud browser opening /teacher/posts/new redirected to app.netlify.com/edge-access and displayed **Team protection**. This hosting gate prevents anonymous crawlers from reaching preview HTML/images, independently of application auth/robots. No bypass or protection-setting change was attempted. Therefore preview OG-card acceptance, real composer clicks and authenticated Blobs writes remain unverified. The local production-server fixture returned 200 with initial HTML OG/Twitter metadata and image/jpeg, as asserted by e2e-share.cjs.

opengraph.xyz returned a site-rendered 403 "This request was blocked" on the initial visit and one reload. Facebook Sharing Debugger displayed the requirement to log into Facebook; this browser has no active Facebook session. Neither external check is marked passed. Telegram Saved Messages was not sent; no signed-in Telegram session was available to the automation. This does not describe the user's own browser sessions.

Before real crawler acceptance, an authorised deployment configuration must expose the intended public /p and /media endpoints to unauthenticated requests. Keep teacher write endpoints protected. The current app code contains no public-write bypass or scraper-only authentication exception. Review the deployment protection on a suitable staging/public deployment; do not interpret a successful Netlify build as a successful social-card crawl.
