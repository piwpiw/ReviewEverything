-- Base schema for first-time database provisioning
-- This migration must run before follow-up migrations that reference these tables.

CREATE TABLE IF NOT EXISTS "Platform" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "base_url" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Campaign" (
  "id" SERIAL PRIMARY KEY,
  "platform_id" INTEGER NOT NULL,
  "original_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "campaign_type" TEXT,
  "media_type" TEXT,
  "category" TEXT,
  "sub_category" TEXT,
  "region_depth1" TEXT,
  "region_depth2" TEXT,
  "location" TEXT,
  "lat" DOUBLE PRECISION,
  "lng" DOUBLE PRECISION,
  "reward_text" TEXT,
  "reward_value" INTEGER NOT NULL DEFAULT 0,
  "shop_url" TEXT,
  "thumbnail_url" TEXT,
  "url" TEXT NOT NULL,
  "recruit_count" INTEGER NOT NULL DEFAULT 0,
  "applicant_count" INTEGER NOT NULL DEFAULT 0,
  "competition_rate" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
  "apply_end_date" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Campaign_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "Platform"("id") ON DELETE CASCADE,
  CONSTRAINT "Campaign_platform_id_original_id_key" UNIQUE ("platform_id", "original_id")
);

CREATE TABLE IF NOT EXISTS "CampaignSnapshot" (
  "id" SERIAL PRIMARY KEY,
  "campaign_id" INTEGER NOT NULL,
  "recruit_count" INTEGER NOT NULL DEFAULT 0,
  "applicant_count" INTEGER NOT NULL DEFAULT 0,
  "competition_rate" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
  "scraped_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "CampaignSnapshot_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "IngestRun" (
  "id" SERIAL PRIMARY KEY,
  "platform_id" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "records_added" INTEGER NOT NULL DEFAULT 0,
  "records_updated" INTEGER NOT NULL DEFAULT 0,
  "error_log" TEXT,
  "start_time" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "end_time" TIMESTAMPTZ,
  CONSTRAINT "IngestRun_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "Platform"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "nickname" VARCHAR(100),
  "notify_kakao_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "notify_telegram_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "notify_push_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "UserSchedule" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "campaign_id" INTEGER,
  "custom_title" VARCHAR(255),
  "status" VARCHAR(50) NOT NULL DEFAULT 'APPLIED',
  "visit_date" TIMESTAMPTZ,
  "deadline_date" TIMESTAMPTZ,
  "sponsorship_value" INTEGER NOT NULL DEFAULT 0,
  "ad_fee" INTEGER NOT NULL DEFAULT 0,
  "alarm_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "memo" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "UserSchedule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "UserSchedule_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "NotificationDelivery" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "user_schedule_id" INTEGER NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'push',
  "attempted_channels" TEXT,
  "due_days" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "message" TEXT,
  "error_message" TEXT,
  "sent_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "NotificationDelivery_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "NotificationDelivery_user_schedule_id_fkey" FOREIGN KEY ("user_schedule_id") REFERENCES "UserSchedule"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Campaign_platform_id_idx" ON "Campaign" ("platform_id");
CREATE INDEX IF NOT EXISTS "Campaign_campaign_type_idx" ON "Campaign" ("campaign_type");
CREATE INDEX IF NOT EXISTS "Campaign_media_type_idx" ON "Campaign" ("media_type");
CREATE INDEX IF NOT EXISTS "Campaign_category_idx" ON "Campaign" ("category");
CREATE INDEX IF NOT EXISTS "Campaign_region_depth_idx" ON "Campaign" ("region_depth1", "region_depth2");
CREATE INDEX IF NOT EXISTS "Campaign_reward_value_idx" ON "Campaign" ("reward_value");
CREATE INDEX IF NOT EXISTS "Campaign_competition_rate_idx" ON "Campaign" ("competition_rate");
CREATE INDEX IF NOT EXISTS "Campaign_apply_end_date_idx" ON "Campaign" ("apply_end_date");
CREATE INDEX IF NOT EXISTS "Campaign_created_at_idx" ON "Campaign" ("created_at");

CREATE INDEX IF NOT EXISTS "CampaignSnapshot_campaign_id_idx" ON "CampaignSnapshot" ("campaign_id");
CREATE INDEX IF NOT EXISTS "CampaignSnapshot_scraped_at_idx" ON "CampaignSnapshot" ("scraped_at");
CREATE INDEX IF NOT EXISTS "CampaignSnapshot_counts_idx" ON "CampaignSnapshot" ("applicant_count", "recruit_count");

CREATE INDEX IF NOT EXISTS "IngestRun_platform_id_idx" ON "IngestRun" ("platform_id");
CREATE INDEX IF NOT EXISTS "IngestRun_status_idx" ON "IngestRun" ("status");
CREATE INDEX IF NOT EXISTS "IngestRun_start_time_idx" ON "IngestRun" ("start_time");

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User" ("email");
CREATE INDEX IF NOT EXISTS "UserSchedule_user_id_deadline_idx" ON "UserSchedule" ("user_id", "deadline_date");
CREATE INDEX IF NOT EXISTS "UserSchedule_status_idx" ON "UserSchedule" ("status");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_user_id_status_idx" ON "NotificationDelivery" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_status_idx" ON "NotificationDelivery" ("status");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_created_at_idx" ON "NotificationDelivery" ("created_at");
