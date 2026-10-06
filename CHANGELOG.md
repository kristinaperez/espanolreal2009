## [2026-10-06] — Teacher cabinet and social profiles

### Changed
- Remove melting-face emoji from money template and restored mock drafts.
- Move interactive publication button into authenticated /teacher/posts/publish; guest generator has no publication control.
### Added
- Authenticated cabinet settings for eight network profile/channel links, per-user private Netlify Blobs storage and explicit profile-opening actions in sharing panel.
- Immediate draft save before cabinet handoff; server owner derives exclusively from session.
### Tests
- Lint/typecheck/build, URL/ownership/auth/origin checks, security/model/share checks; browser evidence in PR. Real Netlify settings persistence and account-side publishing remain manual QA.

## [2026-10-05] — Mobile sharing feedback

### Changed
- Russian-only visible interface; translations retained for future settings.
- Hide visual search notes and sharing implementation text, remove duplicate dashboard CTA; colored network icons with hover shadow and truthful upload status.
- Clarify on-site trainer publication; offer opening the configured Telegram Mini App from web login.
### Fixed
- Mini App HMAC includes signature-bearing payloads while retaining freshness/integrity checks and Login Widget compatibility.
- Bound Telegram URL to title/public link; mobile link-capable network buttons use their own composer, WhatsApp avoids file payload.
- First copy-link attempts copy after publication; robust download anchor lifecycle.
### Added
- Lossless numbered Threads/Pinterest exports and complete TXT download.
### Tests
- Lint/typecheck/build, protocol/security/share/model tests; Chromium acceptance evidence in PR. Real iOS/Android app delivery and production AI require device/configuration acceptance.

## [2026-10-04] — Image and public-link sharing

### Added
- Eight accessible Simple Icons, typed shared buttons/config, RU/FR sharing labels.
- Precomputed image File for mobile system sharing, caption clipboard fallback, cancellation handling and explicit image download.
- Netlify Blobs immutable public snapshots, server-rendered /p/[id], specific OG/Twitter raster images and vertical Pinterest rendition.
- Seven encoded desktop share intents, Instagram manual upload, preview retention/orphan cleanup.
### Fixed
- Image was never passed to share; non-WhatsApp buttons mostly copied text. Profiles are not required.
- Existing full-project lint errors corrected separately without disabling rules; language persistence waits for hydration.
### Tests
- Full lint/typecheck/build, static export, security/model checks, Sharp/store unit checks and Chromium file/intent/OG tests. Installed apps and live authenticated storage writes remain manual acceptance.

## [2026-10-04] — Context meme picker

### Added
- Three contextual original visual treatments, no-meme choice, bounded JPG/PNG/WebP upload, HTTPS replacement and restore-own-image action.
### Changed
- Preserve visual choices in local drafts and published JSON; export hides media URLs when opted out. Uploaded images download as JPEG; remote media opens its original URL.
### Security
- Raster upload is decoded/resized/re-encoded, with format/pixel/file/data limits. Server accepts only bounded JPEG data and safe HTTPS links; publish-only body limit is 256 KiB.
### Tests
- Production/typecheck, changed-file lint, model validation, Chromium picker/4C suites and actual Drizzle/PGlite round-trip checks.

# WOW posts: 4C follow-up

- Emotional visual hook, compact story, 1–2 core phrases and 4–5 varied micro-challenges with independent local progress.
- Three curated demo packs: aprovechar, money idioms, saber/saberse; honest basic fallback for other sources and stricter real AI prompt/schema.
- Original animated cat visual, optional teacher-supplied image/GIF, static PNG download; editable challenges and separate answer-key export.
- Existing legacy posts remain readable; no lesson/course progress or database migration changes.

# Generator follow-up

- Guest generation starts the labelled mock directly; no separate unlock click.
- Disabling lesson CTA disables link fields and skips URL validation for them.
- Removed the account-specific KristinaPerez9 helper from the editor UI. Server CTA policy unchanged.

# WOW social posts and mobile layout

- Responsive landing header/hero, separate social post studio, structured edit/quiz and eight social export buttons.
- Server-verified author CTA; optional AI adapter, labelled mock, separate post persistence/publication and device-local drafts.
- Existing TeacherLesson/demo and student progress remain unchanged. See docs/TEACHER_POSTS.md.

## [2026-10-04] — Teacher Lesson Phase 1

### Added
- Independent Teacher/TeacherLesson types, Drizzle schema, reviewed additive SQL and optional demo seed.
- Fictional teacher profile and public interactive demo lesson with choice/text questions.
- Vendor-independent teacher funnel event adapter and validated booking/social contacts.
- Audit, architecture/QA notes and Teacher regression checks.

### Changed
- Append Teachers discovery entry to existing navigation and public landing footer.

### Security
- Public teacher projection excludes email; no write endpoints or AI generation.
- Teacher text renders without unsafe HTML; external URLs have provider allowlists.
- Published demo remains pending/noindex and absent from sitemap.

### Tests
- See `docs/TEACHER_PHASE1_QA.md` for executed checks and outstanding device/integration QA.
