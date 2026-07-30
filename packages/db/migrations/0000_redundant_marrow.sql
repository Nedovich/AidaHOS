CREATE TYPE "public"."event_status" AS ENUM('draft', 'scheduled', 'live', 'full', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."membership_scope" AS ENUM('hotel_group', 'hotel');--> statement-breakpoint
CREATE TYPE "public"."pms_type" AS ENUM('none', 'mssql_generic', 'opera', 'protel', 'sis', 'elektraweb');--> statement-breakpoint
CREATE TYPE "public"."radius_backend_type" AS ENUM('central_freeradius', 'local_mikrotik');--> statement-breakpoint
CREATE TYPE "public"."survey_response_status" AS ENUM('new', 'reviewed', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."survey_status" AS ENUM('draft', 'published', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'trial', 'suspended', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'user', 'customer');--> statement-breakpoint
CREATE TABLE "hotel_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "tenant_status" DEFAULT 'active' NOT NULL,
	"owner_name" text,
	"owner_email" text,
	"region" text,
	"plan" text DEFAULT 'scale' NOT NULL,
	"mrr" integer DEFAULT 0 NOT NULL,
	"ai_used" integer DEFAULT 0 NOT NULL,
	"ai_limit" integer DEFAULT 100000 NOT NULL,
	"color" text DEFAULT '#5457D6' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotel_groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_group_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "tenant_status" DEFAULT 'trial' NOT NULL,
	"region" text,
	"rooms" integer DEFAULT 0 NOT NULL,
	"guests_online" integer DEFAULT 0 NOT NULL,
	"color" text DEFAULT '#2F6E78' NOT NULL,
	"pms_type" "pms_type" DEFAULT 'none' NOT NULL,
	"radius_backend" "radius_backend_type" DEFAULT 'central_freeradius' NOT NULL,
	"mikrotik_ip" text,
	"nas_secret" text,
	"exit_ip" text,
	"mikrotik_api_user" text,
	"mikrotik_api_password" text,
	"mikrotik_api_port" integer,
	"tailscale_host" text,
	"tailscale_ip" text,
	"brand" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"survey_trigger_days" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"impersonated_by" uuid,
	"active_hotel_id" uuid,
	"active_hotel_group_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scope" "membership_scope" NOT NULL,
	"hotel_group_id" uuid,
	"hotel_id" uuid,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_user_group_uq" UNIQUE("user_id","hotel_group_id"),
	CONSTRAINT "memberships_user_hotel_uq" UNIQUE("user_id","hotel_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"impersonated_user_id" uuid,
	"hotel_id" uuid,
	"hotel_group_id" uuid,
	"action" text NOT NULL,
	"target" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel_simulation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"room_no" text NOT NULL,
	"birth_date" text NOT NULL,
	"guest_name" text,
	"check_in" timestamp with time zone,
	"check_out" timestamp with time zone,
	"first_name" text,
	"last_name" text,
	"agency" text,
	"phone" text,
	"email" text,
	"country" text,
	"room_type" text,
	"currency" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotel_simulation_hotel_room" UNIQUE("hotel_id","room_no")
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"hotel_group_id" uuid NOT NULL,
	"hotel_id" uuid,
	"room_no" text,
	"guest_name" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score" numeric(3, 1),
	"status" "survey_response_status" DEFAULT 'new' NOT NULL,
	"source" text,
	"device" text,
	"auth_method" text,
	"completion_seconds" integer,
	"assignee_name" text,
	"nlp_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"internal_notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_group_id" uuid NOT NULL,
	"hotel_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"status" "survey_status" DEFAULT 'draft' NOT NULL,
	"default_locale" text DEFAULT 'en' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_checkout" boolean DEFAULT false NOT NULL,
	"json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"thank_you_title" text,
	"thank_you_description" text,
	"access_control" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "surveys_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "guest_stays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"hotel_group_id" uuid NOT NULL,
	"room_no" text NOT NULL,
	"birth_date" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"check_in" timestamp with time zone,
	"check_out" timestamp with time zone,
	"agency" text,
	"phone" text,
	"email" text,
	"country" text,
	"room_type" text,
	"currency" text,
	"reservation_ref" text,
	"survey_trigger_at" timestamp with time zone,
	"survey_shown_at" timestamp with time zone,
	"last_verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_stays_hotel_room_birth" UNIQUE("hotel_id","room_no","birth_date")
);
--> statement-breakpoint
CREATE TABLE "guest_survey_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"hotel_group_id" uuid NOT NULL,
	"guest_stay_id" uuid NOT NULL,
	"survey_id" uuid,
	"trigger_at" timestamp with time zone NOT NULL,
	"shown_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_group_id" uuid NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"color" text DEFAULT '#6366F1' NOT NULL,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_group_id" uuid NOT NULL,
	"hotel_id" uuid NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"hotel_id" uuid NOT NULL,
	"hotel_group_id" uuid NOT NULL,
	"room_no" text,
	"guest_name" text,
	"phone" text,
	"email" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_registrations_event_room" UNIQUE("event_id","room_no")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_group_id" uuid NOT NULL,
	"hotel_id" uuid NOT NULL,
	"category_id" uuid,
	"location_id" uuid,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cover_url" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"capacity" integer DEFAULT 0 NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"visibility" text DEFAULT 'guest_portal' NOT NULL,
	"options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" uuid NOT NULL,
	"radius_username" text NOT NULL,
	"local_username" text NOT NULL,
	"display_name" text NOT NULL,
	"mikrotik_group" text DEFAULT '' NOT NULL,
	"job_title" text,
	"access_until" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_accounts_radius_username_unique" UNIQUE("radius_username")
);
--> statement-breakpoint
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_hotel_group_id_hotel_groups_id_fk" FOREIGN KEY ("hotel_group_id") REFERENCES "public"."hotel_groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_hotel_group_id_hotel_groups_id_fk" FOREIGN KEY ("hotel_group_id") REFERENCES "public"."hotel_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_simulation" ADD CONSTRAINT "hotel_simulation_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_hotel_group_id_hotel_groups_id_fk" FOREIGN KEY ("hotel_group_id") REFERENCES "public"."hotel_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_hotel_group_id_hotel_groups_id_fk" FOREIGN KEY ("hotel_group_id") REFERENCES "public"."hotel_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_stays" ADD CONSTRAINT "guest_stays_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_stays" ADD CONSTRAINT "guest_stays_hotel_group_id_hotel_groups_id_fk" FOREIGN KEY ("hotel_group_id") REFERENCES "public"."hotel_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_survey_sends" ADD CONSTRAINT "guest_survey_sends_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_survey_sends" ADD CONSTRAINT "guest_survey_sends_hotel_group_id_hotel_groups_id_fk" FOREIGN KEY ("hotel_group_id") REFERENCES "public"."hotel_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_survey_sends" ADD CONSTRAINT "guest_survey_sends_guest_stay_id_guest_stays_id_fk" FOREIGN KEY ("guest_stay_id") REFERENCES "public"."guest_stays"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_survey_sends" ADD CONSTRAINT "guest_survey_sends_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_hotel_group_id_hotel_groups_id_fk" FOREIGN KEY ("hotel_group_id") REFERENCES "public"."hotel_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_locations" ADD CONSTRAINT "event_locations_hotel_group_id_hotel_groups_id_fk" FOREIGN KEY ("hotel_group_id") REFERENCES "public"."hotel_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_locations" ADD CONSTRAINT "event_locations_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_hotel_group_id_hotel_groups_id_fk" FOREIGN KEY ("hotel_group_id") REFERENCES "public"."hotel_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_hotel_group_id_hotel_groups_id_fk" FOREIGN KEY ("hotel_group_id") REFERENCES "public"."hotel_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_event_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_location_id_event_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."event_locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_accounts" ADD CONSTRAINT "staff_accounts_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;