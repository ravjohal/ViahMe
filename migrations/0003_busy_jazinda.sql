CREATE TABLE "decor_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"event_id" varchar,
	"category" text DEFAULT 'general_decor' NOT NULL,
	"item_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"sourcing" text DEFAULT 'hire',
	"sourced" boolean DEFAULT false NOT NULL,
	"notes" text,
	"estimated_cost" numeric(10, 2),
	"actual_cost" numeric(10, 2),
	"vendor" text,
	"link" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milni_lists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"event_id" varchar,
	"title" text DEFAULT 'Milni Ceremony' NOT NULL,
	"description" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milni_pairs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milni_list_id" varchar NOT NULL,
	"sequence" integer DEFAULT 0 NOT NULL,
	"bride_participant_id" varchar,
	"groom_participant_id" varchar,
	"relation_slug" text,
	"relation_label" text,
	"gift_from_groom_amount" integer,
	"gift_from_groom_description" text,
	"gift_from_bride_amount" integer,
	"gift_from_bride_description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milni_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milni_list_id" varchar NOT NULL,
	"side" text NOT NULL,
	"guest_id" varchar,
	"display_name" text NOT NULL,
	"relation" text NOT NULL,
	"relation_label" text,
	"phone" text,
	"email" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ritual_role_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ceremony_slug" text NOT NULL,
	"role_name" text NOT NULL,
	"role_display_name" text NOT NULL,
	"description" text NOT NULL,
	"instructions" text NOT NULL,
	"timing" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ceremony_budget_categories" DROP CONSTRAINT "ceremony_budget_categories_ceremony_type_uuid_ceremony_types_id_fk";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_ceremony_type_uuid_ceremony_types_id_fk";
--> statement-breakpoint
DROP INDEX "ceremony_budget_categories_type_uuid_idx";--> statement-breakpoint
DROP INDEX "events_ceremony_type_uuid_idx";--> statement-breakpoint
ALTER TABLE "budget_allocations" ALTER COLUMN "bucket_category_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ceremony_budget_categories" ALTER COLUMN "ceremony_type_id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "ceremony_types" ALTER COLUMN "tradition_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "ceremony_type_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "bucket_category_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "tradition_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_allocations" ADD COLUMN "auto_low_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_allocations" ADD COLUMN "auto_high_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_allocations" ADD COLUMN "auto_item_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_allocations" ADD COLUMN "is_manual_override" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "link_to" text;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "budget_tracking_mode" text DEFAULT 'ceremony' NOT NULL;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "show_budget_overview" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "show_bucket_budgets" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "show_ceremony_budgets" boolean DEFAULT true;--> statement-breakpoint
CREATE INDEX "decor_items_wedding_idx" ON "decor_items" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "decor_items_event_idx" ON "decor_items" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "decor_items_category_idx" ON "decor_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ritual_role_templates_ceremony_slug_idx" ON "ritual_role_templates" USING btree ("ceremony_slug");--> statement-breakpoint
CREATE INDEX "ritual_role_templates_role_name_idx" ON "ritual_role_templates" USING btree ("role_name");--> statement-breakpoint
CREATE UNIQUE INDEX "ritual_role_templates_ceremony_role_idx" ON "ritual_role_templates" USING btree ("ceremony_slug","role_name");--> statement-breakpoint
ALTER TABLE "ceremony_budget_categories" ADD CONSTRAINT "ceremony_budget_categories_ceremony_type_id_ceremony_types_id_fk" FOREIGN KEY ("ceremony_type_id") REFERENCES "public"."ceremony_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_ceremony_type_id_ceremony_types_id_fk" FOREIGN KEY ("ceremony_type_id") REFERENCES "public"."ceremony_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ceremony_budget_categories" DROP COLUMN "ceremony_type_uuid";--> statement-breakpoint
ALTER TABLE "ceremony_types" DROP COLUMN "cost_breakdown";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "ceremony_type_uuid";