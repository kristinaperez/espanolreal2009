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
