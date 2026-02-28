-- Add background job and user/notification schedule models

CREATE TABLE IF NOT EXISTS "BackgroundJob" (
  "id" SERIAL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "platform_id" INTEGER,
  "payload" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 3,
  "error_log" TEXT,
  "locked_by" TEXT,
  "locked_until" TIMESTAMPTZ,
  "next_run_at" TIMESTAMPTZ DEFAULT now(),
  "started_at" TIMESTAMPTZ,
  "finished_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "BackgroundJob_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "Platform"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "BackgroundJob_status_idx" ON "BackgroundJob" ("status");
CREATE INDEX IF NOT EXISTS "BackgroundJob_type_status_idx" ON "BackgroundJob" ("type", "status");
CREATE INDEX IF NOT EXISTS "BackgroundJob_next_run_at_idx" ON "BackgroundJob" ("next_run_at");
CREATE INDEX IF NOT EXISTS "BackgroundJob_platform_id_status_idx" ON "BackgroundJob" ("platform_id", "status");

CREATE TABLE IF NOT EXISTS "User" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "nickname" VARCHAR(100),
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

CREATE INDEX IF NOT EXISTS "UserSchedule_user_id_deadline_idx" ON "UserSchedule" ("user_id", "deadline_date");
CREATE INDEX IF NOT EXISTS "UserSchedule_status_idx" ON "UserSchedule" ("status");

CREATE TABLE IF NOT EXISTS "NotificationDelivery" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "user_schedule_id" INTEGER NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'push',
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

CREATE INDEX IF NOT EXISTS "NotificationDelivery_user_id_status_idx" ON "NotificationDelivery" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_status_idx" ON "NotificationDelivery" ("status");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_created_at_idx" ON "NotificationDelivery" ("created_at");
