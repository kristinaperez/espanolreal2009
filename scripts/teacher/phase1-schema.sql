-- Additive schema only. Review and run once on a backed-up staging DB first.
BEGIN;
CREATE TYPE "public"."teacher_lesson_status" AS ENUM('draft', 'published');
CREATE TYPE "public"."teacher_seo_status" AS ENUM('pending', 'index', 'noindex');
CREATE TYPE "public"."teacher_status" AS ENUM('active', 'inactive');
CREATE TABLE "teacher_lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"slug" text NOT NULL,
	"status" "teacher_lesson_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"summary" text NOT NULL,
	"explanation" text NOT NULL,
	"topic" text NOT NULL,
	"level" text NOT NULL,
	"language" text NOT NULL,
	"estimated_minutes" integer NOT NULL,
	"content_blocks" jsonb NOT NULL,
	"questions" jsonb NOT NULL,
	"source_text" text,
	"source_url" text,
	"seo_title" text NOT NULL,
	"seo_description" text NOT NULL,
	"search_intent" text,
	"seo_status" "teacher_seo_status" DEFAULT 'pending' NOT NULL,
	"index_reason" text,
	"canonical_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teacher_lessons_slug_unique" UNIQUE("slug")
);

CREATE TABLE "teachers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"photo_url" text NOT NULL,
	"bio" text,
	"lesson_rate" numeric(10, 2),
	"currency" text,
	"calendly_url" text,
	"telegram_url" text,
	"whatsapp_url" text,
	"vk_url" text,
	"status" "teacher_status" DEFAULT 'inactive' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teachers_email_unique" UNIQUE("email"),
	CONSTRAINT "teachers_slug_unique" UNIQUE("slug")
);

ALTER TABLE "teacher_lessons" ADD CONSTRAINT "teacher_lessons_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE restrict ON UPDATE no action;
CREATE INDEX "teacher_lessons_teacher_idx" ON "teacher_lessons" USING btree ("teacher_id");
COMMIT;
