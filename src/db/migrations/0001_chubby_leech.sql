CREATE TYPE "public"."document_side" AS ENUM('FRONT', 'BACK');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
ALTER TABLE "tenant_documents" ADD COLUMN "side" "document_side";--> statement-breakpoint
ALTER TABLE "tenant_documents" ADD COLUMN "storage_path" varchar(1000) NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_documents" ADD COLUMN "status" "document_status" DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_documents" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pg_profiles" ADD COLUMN "slug" varchar(250) NOT NULL;--> statement-breakpoint
ALTER TABLE "pg_photos" ADD COLUMN "storage_path" varchar(1000) NOT NULL;--> statement-breakpoint
CREATE INDEX "tenant_documents_tenant_type_idx" ON "tenant_documents" USING btree ("tenant_id","type");--> statement-breakpoint
CREATE INDEX "tenant_documents_status_idx" ON "tenant_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pg_profiles_slug_idx" ON "pg_profiles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "pg_photos_profile_sort_idx" ON "pg_photos" USING btree ("pg_profile_id","sort_order");--> statement-breakpoint
ALTER TABLE "tenant_documents" DROP COLUMN "file_url";--> statement-breakpoint
ALTER TABLE "pg_photos" DROP COLUMN "file_url";--> statement-breakpoint
ALTER TABLE "pg_profiles" ADD CONSTRAINT "pg_profiles_slug_unique" UNIQUE("slug");