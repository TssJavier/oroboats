ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "commercial_email" text;
ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "commission_percent" numeric(5, 2) DEFAULT '0';
