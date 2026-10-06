# Teacher cabinet follow-up, 2026-10-06

CHANGE: Remove 🫠 from the money template and restored mock hooks (immutable published snapshots and manually authored AI text are retained). Move interactive publication into authenticated cabinet route /teacher/posts/publish. Default generator has no guest publication button and a cabinet handoff link for signed-in users. Immediate synchronous owner-scoped local draft save precedes handoff; failure prevents navigation. Existing publication API still requires verified server session and same origin. No student XP/SRS, TeacherLesson, payment, auth signature or database schema changes.

WHY: Make ownership and publication location explicit; profile links are preferences rather than publishing credentials.

FILES: teacher-dashboard, teacher-post-generator, post-share-panel; new social-settings, teacher-socials, teacher-settings/store, /api/teacher/settings, /teacher/posts/publish; templates and focused tests.

SETTINGS: Eight networks; HTTPS hostname allowlist, max2048 per link, max24KiB request, empty field clears saved preference. GET/PUT derive Telegram owner only from signed session, PUT validates same-origin + rate limit, no remote fetching, no public profile settings endpoint. Responses no-store. Netlify Blobs strong consistency, named teacher-settings-production or preview-origin-hashed namespace, separate from public snapshots/cleanup. Settings persist until overwritten/cleared; no snapshots/history/token storage added. Real Netlify runtime write not yet verified. A read failure disables Save to prevent overwriting unseen settings.

USER FLOW: Sign in → cabinet “Мои соцсети” → enter profile/channel links → Save → generate post → saved “Открыть мой…” links shown. Opening a profile does not transmit a post or choose the share composer account. Existing share actions remain separately labelled; Telegram share selects the chat/channel in Telegram (https://core.telegram.org/widgets/share). The user chose manual sharing/profile links, not OAuth automation. No account ownership verification is claimed for manually entered public URLs.

PUBLICATION: The cabinet “Мой пост” links to same-device draft review/publication. Signed-in users can create/publish inside cabinet; guest route shows login only. Published page remains public for readers. Draft content is still local and keyed by owner; no cross-device draft synchronization is promised. Settings links are server stored across devices. Existing public-share snapshots remain authenticated on creation, readable without login afterward.

RISK: Netlify settings-store availability; other devices lack local draft; a saved profile link cannot force the target account of a social app. No direct-to-channel publishing or new social API permissions.

MANUAL QA:
- Guest /teacher/posts/new has no publication button; /teacher/posts/publish shows login.
- After login, save/reload all eight links in cabinet; generate and open exactly those links.
- Clear links, save, verify removed in generator after navigating back.
- Switch Telegram user; prior user's profile settings/draft must not appear.
- Click cabinet handoff immediately after generation/edit; preview retains newest post. Publish produces existing public interactive post.
- Verify actual Netlify settings persistence on production; device/social app account choice remains manual.

TEST / RESULT: Full lint, tsc --noEmit, production build passed. URL/auth/origin/forged-owner/isolation checks passed, plus existing security/post/share/Telegram protocol checks. Chromium controlled-session/settings test passes guest gate, eight-network settings flow (TG/IG entered and restored), correct profile links, immediate newest-draft handoff, no melting emoji, account separation and responsive widths. Existing sharing/4C/meme/teacher suites pass, including actual generator mock endpoint and mocked publication response. Real Netlify settings-store write, live signed-in production publish and installed-social-app navigation remain unverified.
