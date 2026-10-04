-- Optional fictional fixture. Do not overwrite an existing teacher identity.
INSERT INTO teachers (id, email, slug, display_name, photo_url, bio, lesson_rate, currency, status)
VALUES ('teacher-demo', 'demo-teacher@example.invalid', 'demo-teacher', 'Демо-преподаватель',
'/teachers/demo-avatar.svg', 'Тестовый профиль EspanolReal; не предложение реальных занятий.', 20, 'EUR', 'active')
ON CONFLICT DO NOTHING;
-- The Phase 1 lesson is a server-only hardcoded fixture owned by teacher-demo.
-- Public routes intentionally use the fixture repository, not this optional DB row.
