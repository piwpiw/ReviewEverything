-- Add attempted channel history to notification deliveries

ALTER TABLE "NotificationDelivery" ADD COLUMN IF NOT EXISTS "attempted_channels" TEXT;
