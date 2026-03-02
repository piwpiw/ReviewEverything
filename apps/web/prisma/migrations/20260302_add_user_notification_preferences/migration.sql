-- Add notification channel preference flags to User

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_kakao_enabled" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_telegram_enabled" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notify_push_enabled" BOOLEAN NOT NULL DEFAULT TRUE;
