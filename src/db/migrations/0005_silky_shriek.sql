ALTER TABLE "tenant_documents" DROP CONSTRAINT "tenant_documents_tenant_id_tenants_id_fk";
--> statement-breakpoint
DROP INDEX "tenant_documents_tenant_idx";--> statement-breakpoint
DROP INDEX "tenant_documents_tenant_type_idx";--> statement-breakpoint
DROP INDEX "tenant_documents_status_idx";--> statement-breakpoint
ALTER TABLE "tenant_documents" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tenant_documents" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tenant_documents" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tenant_documents" ALTER COLUMN "storage_path" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tenant_documents" ADD COLUMN "side" "document_side";--> statement-breakpoint
ALTER TABLE "tenant_documents" ADD CONSTRAINT "tenant_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_documents_tenant_type_side_status_idx" ON "tenant_documents" USING btree ("tenant_id","type","side","status");--> statement-breakpoint
ALTER TABLE "tenant_documents" DROP COLUMN "document_side";--> statement-breakpoint
ALTER TABLE "tenant_documents" DROP COLUMN "archived_at";