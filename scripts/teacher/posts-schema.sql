-- Additive migration only. Apply explicitly to the server database before publishing posts.
BEGIN;
CREATE TABLE IF NOT EXISTS teacher_post_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL UNIQUE,
  display_name text NOT NULL,
  lessons_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS teacher_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES teacher_post_authors(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published')),
  post jsonb NOT NULL,
  cta jsonb,
  mode text NOT NULL CHECK (mode IN ('ai', 'mock')),
  published_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS teacher_posts_author_idx ON teacher_posts(author_id);
COMMIT;
