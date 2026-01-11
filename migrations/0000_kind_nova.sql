CREATE TABLE "bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"event_id" varchar,
	"vendor_id" varchar NOT NULL,
	"requested_date" timestamp,
	"time_slot" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"booking_source" text DEFAULT 'platform' NOT NULL,
	"request_date" timestamp DEFAULT now() NOT NULL,
	"confirmed_date" timestamp,
	"declined_date" timestamp,
	"decline_reason" text,
	"alternate_slots" jsonb,
	"estimated_cost" numeric(10, 2),
	"notes" text,
	"couple_notes" text,
	"vendor_notes" text,
	"deposit_amount" numeric(10, 2),
	"deposit_percentage" integer DEFAULT 25,
	"deposit_paid" boolean DEFAULT false,
	"deposit_paid_date" timestamp,
	"stripe_payment_intent_id" text,
	"stripe_payment_status" text
);
--> statement-breakpoint
CREATE TABLE "budget_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"name" text NOT NULL,
	"alert_type" text NOT NULL,
	"bucket" text,
	"threshold_percent" integer,
	"threshold_amount" numeric(10, 2),
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_triggered" boolean DEFAULT false NOT NULL,
	"triggered_at" timestamp,
	"last_checked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_allocations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"bucket_category_id" varchar,
	"bucket" text NOT NULL,
	"ceremony_id" varchar,
	"line_item_label" text,
	"allocated_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_bucket_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"icon_name" text,
	"is_essential" boolean DEFAULT true,
	"suggested_percentage" integer,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_system_category" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "budget_bucket_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ceremony_budget_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar,
	"source_category_id" varchar,
	"ceremony_type_id" text NOT NULL,
	"budget_bucket_id" text NOT NULL,
	"item_name" text NOT NULL,
	"low_cost" numeric(12, 2) NOT NULL,
	"high_cost" numeric(12, 2) NOT NULL,
	"unit" text NOT NULL,
	"hours_low" numeric(6, 2),
	"hours_high" numeric(6, 2),
	"notes" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ceremony_explainers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"event_id" varchar NOT NULL,
	"ceremony_type" text NOT NULL,
	"tradition" text NOT NULL,
	"title" text NOT NULL,
	"short_explainer" text NOT NULL,
	"full_explainer" text NOT NULL,
	"key_moments" jsonb,
	"cultural_significance" text,
	"guest_tips" text[],
	"attire_guidance" text,
	"target_audience" text DEFAULT 'all' NOT NULL,
	"is_auto_generated" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ceremony_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ceremony_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tradition_id" varchar,
	"tradition" text NOT NULL,
	"cost_per_guest_low" numeric(10, 2) NOT NULL,
	"cost_per_guest_high" numeric(10, 2) NOT NULL,
	"default_guests" integer DEFAULT 100 NOT NULL,
	"cost_breakdown" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ceremony_types_ceremony_id_unique" UNIQUE("ceremony_id")
);
--> statement-breakpoint
CREATE TABLE "collaborator_activity_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"collaborator_id" varchar,
	"user_id" varchar,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" varchar,
	"details" jsonb,
	"performed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication_recipients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"communication_id" varchar NOT NULL,
	"household_id" varchar NOT NULL,
	"email" text,
	"phone" text,
	"channel" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "contract_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer,
	"uploaded_by" varchar NOT NULL,
	"uploader_role" text NOT NULL,
	"category" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" varchar NOT NULL,
	"milestone_index" integer,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text,
	"transaction_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"receipt_url" text,
	"recorded_by" varchar NOT NULL,
	"recorder_role" text NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_signatures" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" varchar NOT NULL,
	"signer_id" varchar NOT NULL,
	"signer_name" text NOT NULL,
	"signer_email" text NOT NULL,
	"signer_role" text NOT NULL,
	"signature_data" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"signed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"vendor_category" text NOT NULL,
	"description" text,
	"template_content" text NOT NULL,
	"key_terms" jsonb,
	"suggested_milestones" jsonb,
	"is_default" boolean DEFAULT false,
	"is_custom" boolean DEFAULT false,
	"wedding_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"event_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"booking_id" varchar,
	"contract_terms" text,
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_milestones" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"signed_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_status" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"wedding_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"event_id" varchar,
	"status" text DEFAULT 'open' NOT NULL,
	"closed_by" varchar,
	"closed_by_type" text,
	"closure_reason" text,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_status_conversation_id_unique" UNIQUE("conversation_id")
);
--> statement-breakpoint
CREATE TABLE "dashboard_widgets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"widget_type" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"event_id" varchar,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_by" varchar NOT NULL,
	"shared_with_vendors" text[] DEFAULT ARRAY[]::text[],
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engagement_games" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"event_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"game_type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"points_per_challenge" integer DEFAULT 10,
	"start_time" timestamp,
	"end_time" timestamp,
	"show_leaderboard" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_cost_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"category_id" varchar,
	"ceremony_budget_category_id" varchar,
	"budget_bucket_category_id" varchar,
	"name" text NOT NULL,
	"cost_type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"low_estimate" numeric(10, 2),
	"high_estimate" numeric(10, 2),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"ceremony_type_id" varchar,
	"date" timestamp,
	"time" text,
	"location" text,
	"guest_count" integer,
	"description" text,
	"order" integer NOT NULL,
	"side" text DEFAULT 'mutual' NOT NULL,
	"visibility" text DEFAULT 'shared' NOT NULL,
	"cost_per_head" numeric(8, 2),
	"allocated_budget" numeric(10, 2),
	"venue_capacity" integer,
	"dress_code" text,
	"location_details" text,
	"directions" text,
	"map_url" text,
	"parking_info" text,
	"livestream_url" text
);
--> statement-breakpoint
CREATE TABLE "expense_splits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"user_name" text NOT NULL,
	"share_amount" numeric(10, 2) NOT NULL,
	"share_percentage" integer,
	"is_paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"ceremony_id" text,
	"event_id" varchar,
	"parent_category" text NOT NULL,
	"bucket_category_id" varchar,
	"event_cost_item_id" varchar,
	"expense_name" text NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"amount_paid" numeric(12, 2) DEFAULT '0',
	"status" text DEFAULT 'estimated' NOT NULL,
	"paid_by_id" varchar NOT NULL,
	"paid_by_name" text NOT NULL,
	"vendor_id" varchar,
	"notes" text,
	"receipt_url" text,
	"payment_due_date" timestamp,
	"expense_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follow_up_reminders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"conversation_id" varchar NOT NULL,
	"wedding_id" varchar NOT NULL,
	"reminder_date" timestamp NOT NULL,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_participation" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" varchar NOT NULL,
	"guest_id" varchar NOT NULL,
	"household_id" varchar,
	"total_points" integer DEFAULT 0 NOT NULL,
	"challenges_completed" integer DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gap_recommendations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gap_window_id" varchar NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"address" text,
	"map_url" text,
	"google_place_id" text,
	"estimated_travel_time" integer,
	"price_level" text,
	"photo_url" text,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gap_windows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"before_event_id" varchar NOT NULL,
	"after_event_id" varchar NOT NULL,
	"label" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"shuttle_schedule" jsonb,
	"special_instructions" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_budget_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"default_cost_per_head" numeric(8, 2),
	"max_guest_budget" numeric(10, 2),
	"target_guest_count" integer,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guest_budget_settings_wedding_id_unique" UNIQUE("wedding_id")
);
--> statement-breakpoint
CREATE TABLE "guest_collector_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"name" text NOT NULL,
	"side" text NOT NULL,
	"created_by_id" varchar NOT NULL,
	"created_by_name" text,
	"max_submissions" integer,
	"submission_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guest_collector_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "guest_collector_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collector_link_id" varchar NOT NULL,
	"wedding_id" varchar NOT NULL,
	"submitter_name" text,
	"submitter_relation" text,
	"household_name" text NOT NULL,
	"main_contact_name" text,
	"main_contact_phone" text,
	"main_contact_email" text,
	"contact_street" text,
	"contact_city" text,
	"contact_state" text,
	"contact_postal_code" text,
	"contact_country" text,
	"guest_count" integer DEFAULT 1,
	"dietary_restriction" text,
	"members" jsonb,
	"event_suggestions" text[],
	"relationship_tier" text,
	"notes" text,
	"submission_session_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" varchar,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_communications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"type" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"channel" text DEFAULT 'email' NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"sent_by_id" varchar NOT NULL,
	"event_ids" text[],
	"household_ids" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_list_scenarios" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"budget_limit" numeric(10, 2),
	"cost_per_head" numeric(8, 2),
	"is_active" boolean DEFAULT false NOT NULL,
	"total_seats" integer,
	"total_cost" numeric(10, 2),
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"household_id" varchar,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"related_gap_id" varchar,
	"related_stage_id" varchar,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"channel" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_sources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"side" text DEFAULT 'bride' NOT NULL,
	"quota_limit" integer,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"household_id" varchar,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address_street" text,
	"address_city" text,
	"address_state" text,
	"address_postal_code" text,
	"address_country" text,
	"is_main_household_contact" boolean DEFAULT false,
	"side" text DEFAULT 'mutual' NOT NULL,
	"relationship_tier" text,
	"group" text,
	"event_ids" text[],
	"rsvp_status" text DEFAULT 'pending',
	"plus_one" boolean DEFAULT false,
	"plus_one_for_guest_id" varchar,
	"dietary_restrictions" text,
	"magic_link_token_hash" varchar,
	"magic_link_expires" timestamp,
	"visibility" text DEFAULT 'shared' NOT NULL,
	"added_by_side" text,
	"consensus_status" text DEFAULT 'approved' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guests_magic_link_token_hash_unique" UNIQUE("magic_link_token_hash")
);
--> statement-breakpoint
CREATE TABLE "household_merge_audits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"survivor_household_id" varchar NOT NULL,
	"merged_household_id" varchar NOT NULL,
	"decision" text NOT NULL,
	"survivor_snapshot" jsonb NOT NULL,
	"merged_snapshot" jsonb NOT NULL,
	"guests_moved" integer DEFAULT 0 NOT NULL,
	"invitations_moved" integer DEFAULT 0 NOT NULL,
	"reviewed_by_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"name" text NOT NULL,
	"address_street" text,
	"address_city" text,
	"address_state" text,
	"address_postal_code" text,
	"address_country" text,
	"max_count" integer DEFAULT 1 NOT NULL,
	"affiliation" text DEFAULT 'bride' NOT NULL,
	"relationship_tier" text DEFAULT 'friend' NOT NULL,
	"priority_tier" text DEFAULT 'should_invite' NOT NULL,
	"source_id" varchar,
	"desi_dietary_type" text,
	"head_of_house_index" integer DEFAULT 0,
	"lifafa_amount" numeric(10, 2),
	"gift_description" text,
	"gift_notes" text,
	"thank_you_sent" boolean DEFAULT false,
	"magic_link_token_hash" varchar,
	"magic_link_token" varchar,
	"magic_link_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "households_magic_link_token_hash_unique" UNIQUE("magic_link_token_hash")
);
--> statement-breakpoint
CREATE TABLE "ignored_duplicate_pairs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"household_id_1" varchar NOT NULL,
	"household_id_2" varchar NOT NULL,
	"ignored_by_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation_cards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"tradition" text NOT NULL,
	"ceremony_type" text NOT NULL,
	"image_url" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" varchar NOT NULL,
	"event_id" varchar NOT NULL,
	"rsvp_status" text DEFAULT 'pending' NOT NULL,
	"dietary_restrictions" text,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"plus_one_attending" boolean
);
--> statement-breakpoint
CREATE TABLE "lead_activity_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"activity_type" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"performed_by" varchar,
	"performed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_nurture_actions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"step_id" varchar NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"executed_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_nurture_sequences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"trigger_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_nurture_steps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_id" varchar NOT NULL,
	"step_number" integer NOT NULL,
	"delay_days" integer DEFAULT 0 NOT NULL,
	"action_type" text NOT NULL,
	"email_subject" text,
	"email_template" text,
	"reminder_text" text,
	"new_status" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "live_wedding_status" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"is_live" boolean DEFAULT false NOT NULL,
	"current_event_id" varchar,
	"current_stage_id" varchar,
	"current_gap_id" varchar,
	"last_broadcast_message" text,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "live_wedding_status_wedding_id_unique" UNIQUE("wedding_id")
);
--> statement-breakpoint
CREATE TABLE "measurement_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" varchar NOT NULL,
	"blouse_size" text,
	"waist" numeric(5, 2),
	"inseam" numeric(5, 2),
	"sari_blouse_style" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"wedding_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"event_id" varchar,
	"sender_id" varchar NOT NULL,
	"sender_type" text NOT NULL,
	"content" text NOT NULL,
	"attachments" jsonb,
	"is_read" boolean DEFAULT false,
	"message_type" text DEFAULT 'message',
	"booking_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"email" text,
	"phone" text,
	"booking_confirmations_enabled" boolean DEFAULT true,
	"payment_reminders_enabled" boolean DEFAULT true,
	"event_alerts_enabled" boolean DEFAULT true,
	"contract_updates_enabled" boolean DEFAULT true,
	"preferred_channel" text DEFAULT 'email',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_wedding_id_unique" UNIQUE("wedding_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"recipient_type" text NOT NULL,
	"recipient_email" text,
	"recipient_phone" text,
	"type" text NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"sent_at" timestamp,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"card_id" varchar NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_per_item" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_payment_status" text,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"shipping_name" text NOT NULL,
	"shipping_email" text NOT NULL,
	"shipping_phone" text,
	"shipping_address" text NOT NULL,
	"shipping_city" text NOT NULL,
	"shipping_state" text NOT NULL,
	"shipping_zip" text NOT NULL,
	"shipping_country" text DEFAULT 'USA' NOT NULL,
	"order_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photo_galleries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"wedding_id" varchar,
	"vendor_id" varchar,
	"event_id" varchar,
	"description" text,
	"cover_photo_url" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" varchar NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"order" integer DEFAULT 0 NOT NULL,
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlist_songs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playlist_id" varchar NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"duration" text,
	"category" text,
	"streaming_link" text,
	"requested_by" text,
	"is_guest_request" boolean DEFAULT false,
	"notes" text,
	"vote_count" integer DEFAULT 0,
	"status" text DEFAULT 'pending' NOT NULL,
	"order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"event_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"shared_with_vendors" text[] DEFAULT ARRAY[]::text[],
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quick_reply_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"category" text,
	"is_default" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"event_id" varchar NOT NULL,
	"sender_email" text NOT NULL,
	"sender_name" text NOT NULL,
	"event_name" text NOT NULL,
	"event_date" text,
	"event_location" text,
	"guest_count" integer,
	"budget_range" text,
	"additional_notes" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regional_pricing" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city" text NOT NULL,
	"display_name" text NOT NULL,
	"multiplier" numeric(4, 2) NOT NULL,
	"venue_multiplier" numeric(4, 2),
	"catering_multiplier" numeric(4, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "regional_pricing_city_unique" UNIQUE("city")
);
--> statement-breakpoint
CREATE TABLE "registry_retailers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"website_url" text NOT NULL,
	"registry_url_pattern" text,
	"help_text" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "registry_retailers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"helpful" integer DEFAULT 0,
	"created_by_id" varchar,
	"created_by_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ritual_role_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"event_id" varchar NOT NULL,
	"guest_id" varchar NOT NULL,
	"role_name" text NOT NULL,
	"role_display_name" text NOT NULL,
	"description" text,
	"instructions" text,
	"timing" text,
	"location" text,
	"attire_notes" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"acknowledged_at" timestamp,
	"notification_sent" boolean DEFAULT false,
	"notification_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ritual_stage_updates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ritual_stage_id" varchar NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"delay_minutes" integer,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ritual_stages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"stage_key" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"planned_start_time" timestamp,
	"planned_duration" integer,
	"display_order" integer NOT NULL,
	"guest_instructions" text,
	"notify_on_start" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" varchar NOT NULL,
	"category" text NOT NULL,
	"level" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scavenger_challenges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" varchar NOT NULL,
	"prompt" text NOT NULL,
	"description" text,
	"points" integer DEFAULT 10 NOT NULL,
	"requires_photo" boolean DEFAULT true,
	"verification_mode" text DEFAULT 'auto' NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scavenger_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" varchar NOT NULL,
	"guest_id" varchar NOT NULL,
	"participation_id" varchar NOT NULL,
	"photo_url" text,
	"text_response" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"points_awarded" integer DEFAULT 0,
	"reviewed_by_id" varchar,
	"review_note" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "scenario_households" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_id" varchar NOT NULL,
	"household_id" varchar NOT NULL,
	"is_included" boolean DEFAULT true NOT NULL,
	"adjusted_max_count" integer,
	"notes" text,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_packages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"traditions" text[],
	"categories" text[],
	"features" jsonb,
	"duration" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"item_name" text NOT NULL,
	"store_name" text,
	"status" text DEFAULT 'ordered' NOT NULL,
	"cost_inr" numeric(10, 2),
	"cost_usd" numeric(10, 2),
	"weight_kg" numeric(6, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "song_votes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"song_id" varchar NOT NULL,
	"voter_id" varchar NOT NULL,
	"voter_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar NOT NULL,
	"wedding_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"user_name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_reminders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar NOT NULL,
	"wedding_id" varchar NOT NULL,
	"reminder_type" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"sent_to" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "task_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"tradition" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"ceremony" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"days_before_wedding" integer,
	"phase" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"event_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp,
	"completed" boolean DEFAULT false,
	"priority" text DEFAULT 'medium',
	"category" text,
	"phase" text,
	"assigned_to_id" varchar,
	"assigned_to_name" text,
	"reminder_enabled" boolean DEFAULT false,
	"reminder_date" timestamp,
	"reminder_days_before" integer DEFAULT 1,
	"reminder_method" text DEFAULT 'email',
	"last_reminder_sent_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"is_ai_recommended" boolean DEFAULT false,
	"ai_reason" text,
	"ai_category" text,
	"dismissed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "timeline_changes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"event_id" varchar NOT NULL,
	"change_type" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"changed_by_user_id" varchar NOT NULL,
	"note" text,
	"notifications_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trivia_answers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" varchar NOT NULL,
	"guest_id" varchar NOT NULL,
	"participation_id" varchar NOT NULL,
	"selected_option" integer NOT NULL,
	"is_correct" boolean NOT NULL,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"response_time_ms" integer,
	"answered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trivia_questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" varchar NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_answer" integer NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"explanation" text,
	"sort_order" integer DEFAULT 0,
	"time_limit_seconds" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"verification_token_expires" timestamp,
	"reset_token" text,
	"reset_token_expires" timestamp,
	"last_login_at" timestamp,
	"is_site_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"username" text,
	"password" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor_access_passes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"booking_id" varchar,
	"token" varchar NOT NULL,
	"name" text NOT NULL,
	"event_ids" text[],
	"vendor_categories" text[],
	"timeline_view_type" text DEFAULT 'filtered' NOT NULL,
	"can_view_guest_count" boolean DEFAULT false,
	"can_view_vendor_details" boolean DEFAULT false,
	"can_view_budget" boolean DEFAULT false,
	"status" text DEFAULT 'active' NOT NULL,
	"last_accessed_at" timestamp,
	"access_count" integer DEFAULT 0,
	"expires_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_access_passes_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "vendor_acknowledgments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"event_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"change_id" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"message" text,
	"acknowledged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"profile_views" integer DEFAULT 0 NOT NULL,
	"contact_clicks" integer DEFAULT 0 NOT NULL,
	"email_sent" integer DEFAULT 0 NOT NULL,
	"phone_calls" integer DEFAULT 0 NOT NULL,
	"inquiries_received" integer DEFAULT 0 NOT NULL,
	"proposals_sent" integer DEFAULT 0 NOT NULL,
	"bookings_received" integer DEFAULT 0 NOT NULL,
	"bookings_confirmed" integer DEFAULT 0 NOT NULL,
	"total_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"average_booking_value" numeric(10, 2) DEFAULT '0',
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"period_type" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"time_slot" text,
	"status" text DEFAULT 'available' NOT NULL,
	"wedding_id" varchar,
	"event_id" varchar,
	"booking_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_calendar_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"provider" text NOT NULL,
	"email" text NOT NULL,
	"label" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_synced_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_calendars" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"provider_calendar_id" text NOT NULL,
	"display_name" text NOT NULL,
	"color" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_selected" boolean DEFAULT true NOT NULL,
	"is_write_target" boolean DEFAULT false NOT NULL,
	"sync_direction" text DEFAULT 'read' NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_claim_staging" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"vendor_name" text NOT NULL,
	"vendor_categories" text[] NOT NULL,
	"vendor_location" text,
	"vendor_city" text,
	"claimant_email" text NOT NULL,
	"claimant_name" text,
	"claimant_phone" text,
	"business_documents" text[],
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_event_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"wedding_id" varchar NOT NULL,
	"notify_via" text DEFAULT 'email' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_favorites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_interaction_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"wedding_id" varchar,
	"user_id" varchar,
	"event_type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"wedding_id" varchar NOT NULL,
	"couple_name" text NOT NULL,
	"couple_email" text,
	"source_type" text NOT NULL,
	"source_id" varchar,
	"event_date" timestamp,
	"event_type" text,
	"estimated_budget" text,
	"guest_count" integer,
	"event_location" text,
	"tradition" text,
	"city" text,
	"notes" text,
	"qualification_score" integer DEFAULT 0,
	"urgency_score" integer DEFAULT 0,
	"budget_fit_score" integer DEFAULT 0,
	"engagement_score" integer DEFAULT 0,
	"overall_score" integer DEFAULT 0,
	"status" text DEFAULT 'new' NOT NULL,
	"priority" text DEFAULT 'medium',
	"last_contacted_at" timestamp,
	"next_follow_up_at" timestamp,
	"follow_up_count" integer DEFAULT 0,
	"auto_nurture_enabled" boolean DEFAULT true,
	"nurture_sequence_id" varchar,
	"current_nurture_step" integer DEFAULT 0,
	"first_contact_at" timestamp DEFAULT now() NOT NULL,
	"status_changed_at" timestamp,
	"won_at" timestamp,
	"lost_at" timestamp,
	"lost_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_teammate_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"email" text NOT NULL,
	"permissions" text[] NOT NULL,
	"invite_token" text NOT NULL,
	"invite_token_expires" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by" varchar NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"display_name" text
);
--> statement-breakpoint
CREATE TABLE "vendor_teammates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"permissions" text[] NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"invited_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"revoked_by" varchar
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"categories" text[] NOT NULL,
	"preferred_wedding_traditions" text[],
	"location" text NOT NULL,
	"city" text DEFAULT 'San Francisco Bay Area' NOT NULL,
	"price_range" text NOT NULL,
	"cultural_specialties" text[],
	"description" text,
	"logo_url" text,
	"cover_image_url" text,
	"portfolio" jsonb,
	"availability" jsonb,
	"contact" text,
	"email" text,
	"phone" text,
	"website" text,
	"instagram" text,
	"facebook" text,
	"twitter" text,
	"rating" numeric(2, 1),
	"review_count" integer DEFAULT 0,
	"featured" boolean DEFAULT false,
	"is_published" boolean DEFAULT false NOT NULL,
	"calendar_shared" boolean DEFAULT false NOT NULL,
	"calendar_source" text DEFAULT 'local' NOT NULL,
	"external_calendar_id" text,
	"yelp_business_id" text,
	"google_place_id" text,
	"claimed" boolean DEFAULT true NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_by_user_id" varchar,
	"created_by_user_type" text,
	"claim_token" text,
	"claim_token_expires" timestamp,
	"notify_cooldown_until" timestamp,
	"last_view_notified_at" timestamp,
	"view_count" integer DEFAULT 0 NOT NULL,
	"opted_out_of_notifications" boolean DEFAULT false,
	"sulekha_rating" numeric(3, 1),
	"experience" text,
	"zip_codes_serving" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approval_status" text DEFAULT 'approved' NOT NULL,
	"approval_notes" text,
	"approved_by" varchar,
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "wedding_collaborators" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"user_id" varchar,
	"email" text NOT NULL,
	"role_id" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invite_token" text,
	"invite_token_expires" timestamp,
	"invited_by" varchar NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"display_name" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "wedding_line_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"ceremony_id" varchar,
	"label" text NOT NULL,
	"bucket" text NOT NULL,
	"target_amount" numeric(12, 2) NOT NULL,
	"is_system_generated" boolean DEFAULT false NOT NULL,
	"source_template_item_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_registries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"retailer_id" varchar,
	"custom_retailer_name" text,
	"custom_logo_url" text,
	"registry_url" text NOT NULL,
	"notes" text,
	"sort_order" integer DEFAULT 0,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_sub_traditions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"tradition_id" varchar NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_sub_traditions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "wedding_traditions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_system_tradition" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_traditions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "wedding_websites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" varchar NOT NULL,
	"slug" text NOT NULL,
	"is_published" boolean DEFAULT false,
	"hero_image_url" text,
	"couple_photo_url" text,
	"gallery_photos" text[],
	"welcome_title" text,
	"welcome_message" text,
	"couple_story" text,
	"travel_info" text,
	"accommodation_info" text,
	"things_to_do_info" text,
	"faq_info" text,
	"registry_links" jsonb,
	"primary_color" text DEFAULT '#f97316',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_websites_wedding_id_unique" UNIQUE("wedding_id"),
	CONSTRAINT "wedding_websites_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "weddings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"tradition_id" varchar,
	"tradition" text NOT NULL,
	"sub_tradition" text,
	"sub_traditions" text[],
	"role" text NOT NULL,
	"partner1_name" text,
	"partner2_name" text,
	"couple_email" text,
	"couple_phone" text,
	"wedding_date" timestamp,
	"location" text NOT NULL,
	"guest_count_estimate" integer,
	"ceremony_guest_count" integer,
	"reception_guest_count" integer,
	"total_budget" numeric(10, 2),
	"budget_confirmed" boolean DEFAULT false,
	"events_confirmed" boolean DEFAULT false,
	"budget_contribution" text,
	"partner_new_to_traditions" boolean DEFAULT false,
	"status" text DEFAULT 'planning' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_bucket_category_id_budget_bucket_categories_id_fk" FOREIGN KEY ("bucket_category_id") REFERENCES "public"."budget_bucket_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ceremony_types" ADD CONSTRAINT "ceremony_types_tradition_id_wedding_traditions_id_fk" FOREIGN KEY ("tradition_id") REFERENCES "public"."wedding_traditions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_recipients" ADD CONSTRAINT "communication_recipients_communication_id_guest_communications_id_fk" FOREIGN KEY ("communication_id") REFERENCES "public"."guest_communications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_recipients" ADD CONSTRAINT "communication_recipients_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_collector_submissions" ADD CONSTRAINT "guest_collector_submissions_collector_link_id_guest_collector_links_id_fk" FOREIGN KEY ("collector_link_id") REFERENCES "public"."guest_collector_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_communications" ADD CONSTRAINT "guest_communications_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reminders" ADD CONSTRAINT "task_reminders_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_sub_traditions" ADD CONSTRAINT "wedding_sub_traditions_tradition_id_wedding_traditions_id_fk" FOREIGN KEY ("tradition_id") REFERENCES "public"."wedding_traditions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weddings" ADD CONSTRAINT "weddings_tradition_id_wedding_traditions_id_fk" FOREIGN KEY ("tradition_id") REFERENCES "public"."wedding_traditions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budget_allocations_wedding_bucket_idx" ON "budget_allocations" USING btree ("wedding_id","bucket");--> statement-breakpoint
CREATE INDEX "budget_allocations_wedding_ceremony_idx" ON "budget_allocations" USING btree ("wedding_id","ceremony_id");--> statement-breakpoint
CREATE INDEX "budget_allocations_wedding_bucket_ceremony_idx" ON "budget_allocations" USING btree ("wedding_id","bucket","ceremony_id");--> statement-breakpoint
CREATE INDEX "budget_allocations_bucket_category_idx" ON "budget_allocations" USING btree ("wedding_id","bucket_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "budget_allocations_unique" ON "budget_allocations" USING btree ("wedding_id","bucket","ceremony_id","line_item_label");--> statement-breakpoint
CREATE INDEX "ceremony_budget_categories_wedding_idx" ON "ceremony_budget_categories" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "ceremony_budget_categories_type_idx" ON "ceremony_budget_categories" USING btree ("ceremony_type_id");--> statement-breakpoint
CREATE INDEX "ceremony_budget_categories_bucket_idx" ON "ceremony_budget_categories" USING btree ("budget_bucket_id");--> statement-breakpoint
CREATE INDEX "ceremony_budget_categories_source_idx" ON "ceremony_budget_categories" USING btree ("source_category_id");--> statement-breakpoint
CREATE INDEX "ceremony_explainers_wedding_idx" ON "ceremony_explainers" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "ceremony_explainers_event_idx" ON "ceremony_explainers" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "ceremony_types_tradition_idx" ON "ceremony_types" USING btree ("tradition");--> statement-breakpoint
CREATE INDEX "ceremony_types_tradition_id_idx" ON "ceremony_types" USING btree ("tradition_id");--> statement-breakpoint
CREATE INDEX "communication_recipients_communication_id_idx" ON "communication_recipients" USING btree ("communication_id");--> statement-breakpoint
CREATE INDEX "communication_recipients_household_id_idx" ON "communication_recipients" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "communication_recipients_status_idx" ON "communication_recipients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_cost_items_event_id_idx" ON "event_cost_items" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_cost_items_ceremony_budget_category_id_idx" ON "event_cost_items" USING btree ("ceremony_budget_category_id");--> statement-breakpoint
CREATE INDEX "event_cost_items_budget_bucket_category_id_idx" ON "event_cost_items" USING btree ("budget_bucket_category_id");--> statement-breakpoint
CREATE INDEX "events_wedding_id_idx" ON "events" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "events_ceremony_type_id_idx" ON "events" USING btree ("ceremony_type_id");--> statement-breakpoint
CREATE INDEX "expenses_wedding_id_idx" ON "expenses" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "expenses_parent_category_idx" ON "expenses" USING btree ("parent_category");--> statement-breakpoint
CREATE INDEX "expenses_ceremony_id_idx" ON "expenses" USING btree ("ceremony_id");--> statement-breakpoint
CREATE INDEX "expenses_event_id_idx" ON "expenses" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "expenses_bucket_category_id_idx" ON "expenses" USING btree ("bucket_category_id");--> statement-breakpoint
CREATE INDEX "expenses_event_cost_item_id_idx" ON "expenses" USING btree ("event_cost_item_id");--> statement-breakpoint
CREATE INDEX "guest_communications_wedding_id_idx" ON "guest_communications" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "guest_communications_type_idx" ON "guest_communications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "guest_communications_status_idx" ON "guest_communications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "guests_wedding_id_idx" ON "guests" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "guests_household_id_idx" ON "guests" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "guests_plus_one_for_guest_id_idx" ON "guests" USING btree ("plus_one_for_guest_id");--> statement-breakpoint
CREATE INDEX "task_templates_tradition_idx" ON "task_templates" USING btree ("tradition");--> statement-breakpoint
CREATE INDEX "task_templates_template_id_idx" ON "task_templates" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "tasks_wedding_id_idx" ON "tasks" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "tasks_event_id_idx" ON "tasks" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "tasks_assigned_to_id_idx" ON "tasks" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "vendor_leads_vendor_id_idx" ON "vendor_leads" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_leads_wedding_id_idx" ON "vendor_leads" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "vendors_name_idx" ON "vendors" USING btree ("name");--> statement-breakpoint
CREATE INDEX "vendors_user_id_idx" ON "vendors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vendors_city_idx" ON "vendors" USING btree ("city");--> statement-breakpoint
CREATE INDEX "wedding_line_items_wedding_idx" ON "wedding_line_items" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "wedding_line_items_ceremony_idx" ON "wedding_line_items" USING btree ("ceremony_id");--> statement-breakpoint
CREATE INDEX "wedding_sub_traditions_tradition_idx" ON "wedding_sub_traditions" USING btree ("tradition_id");--> statement-breakpoint
CREATE INDEX "weddings_tradition_idx" ON "weddings" USING btree ("tradition_id");