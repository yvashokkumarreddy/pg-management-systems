CREATE TYPE "public"."document_type" AS ENUM('AADHAAR', 'PHOTO', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('ACTIVE', 'NOTICE_PERIOD', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."rent_status" AS ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('CASH', 'UPI', 'BANK_TRANSFER', 'OTHER');--> statement-breakpoint
CREATE TABLE "tenant_deposits" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(36) NOT NULL,
	"advance_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"maintenance_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"refundable_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_deposits_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "tenant_documents" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(36) NOT NULL,
	"type" "document_type" NOT NULL,
	"file_url" varchar(1000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"owner_id" varchar(36) NOT NULL,
	"room_number" varchar(50) NOT NULL,
	"floor" varchar(50),
	"capacity" integer NOT NULL,
	"rent_per_bed" numeric(10, 2) NOT NULL,
	"notes" varchar(500),
	"status" "room_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "owner_room_unique" UNIQUE("owner_id","room_number")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"owner_id" varchar(36) NOT NULL,
	"room_id" varchar(36),
	"full_name" varchar(150) NOT NULL,
	"mobile" varchar(20) NOT NULL,
	"date_of_birth" timestamp with time zone,
	"emergency_contact_name" varchar(150),
	"emergency_contact_phone" varchar(20),
	"office_name" varchar(200),
	"office_address" varchar(500),
	"permanent_address" varchar(500),
	"date_of_joining" timestamp with time zone NOT NULL,
	"date_of_leaving" timestamp with time zone,
	"monthly_rent" numeric(10, 2) NOT NULL,
	"status" "tenant_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rent_bills" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(36) NOT NULL,
	"billing_period_start" timestamp with time zone NOT NULL,
	"billing_period_end" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"amount_due" numeric(10, 2) NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"balance_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" "rent_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_rent_period_unique" UNIQUE("tenant_id","billing_period_start")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(36) NOT NULL,
	"rent_bill_id" varchar(36) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"mode" "payment_mode" NOT NULL,
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pg_profiles" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"owner_id" varchar(36) NOT NULL,
	"pg_name" varchar(200) NOT NULL,
	"description" varchar(2000),
	"address" varchar(500),
	"contact_number" varchar(20),
	"amenities" jsonb,
	"room_types" jsonb,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pg_profiles_owner_id_unique" UNIQUE("owner_id")
);
--> statement-breakpoint
CREATE TABLE "pg_photos" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"pg_profile_id" varchar(36) NOT NULL,
	"file_url" varchar(1000) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_deposits" ADD CONSTRAINT "tenant_deposits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_documents" ADD CONSTRAINT "tenant_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_bills" ADD CONSTRAINT "rent_bills_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_rent_bill_id_rent_bills_id_fk" FOREIGN KEY ("rent_bill_id") REFERENCES "public"."rent_bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_profiles" ADD CONSTRAINT "pg_profiles_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_photos" ADD CONSTRAINT "pg_photos_pg_profile_id_pg_profiles_id_fk" FOREIGN KEY ("pg_profile_id") REFERENCES "public"."pg_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenant_documents_tenant_idx" ON "tenant_documents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "rooms_owner_idx" ON "rooms" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "rooms_status_idx" ON "rooms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tenants_owner_idx" ON "tenants" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "tenants_room_idx" ON "tenants" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "tenants_status_idx" ON "tenants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tenants_mobile_idx" ON "tenants" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "rent_bills_tenant_idx" ON "rent_bills" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "rent_bills_due_date_idx" ON "rent_bills" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "rent_bills_status_idx" ON "rent_bills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_tenant_idx" ON "payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "payments_rent_bill_idx" ON "payments" USING btree ("rent_bill_id");--> statement-breakpoint
CREATE INDEX "payments_payment_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "pg_photos_profile_idx" ON "pg_photos" USING btree ("pg_profile_id");