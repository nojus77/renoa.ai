-- Add new fields to Lead model
ALTER TABLE "leads" ADD COLUMN "bedrooms" INTEGER;
ALTER TABLE "leads" ADD COLUMN "bathrooms" DECIMAL(4,1);
ALTER TABLE "leads" ADD COLUMN "lot_size" DECIMAL(10,2);
ALTER TABLE "leads" ADD COLUMN "property_age" INTEGER;
ALTER TABLE "leads" ADD COLUMN "last_sale_date" TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN "urgency_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "leads" ADD COLUMN "predicted_service" VARCHAR(255);
ALTER TABLE "leads" ADD COLUMN "confirmed_service" VARCHAR(255);
ALTER TABLE "leads" ADD COLUMN "service_confidence" INTEGER;
ALTER TABLE "leads" ADD COLUMN "service_prediction_reason" TEXT;
ALTER TABLE "leads" ADD COLUMN "other_likely_services" JSONB;
ALTER TABLE "leads" ADD COLUMN "tier" VARCHAR(2) NOT NULL DEFAULT 'T3';
ALTER TABLE "leads" ADD COLUMN "is_priority" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "leads" ADD COLUMN "has_unread_reply" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "leads" ADD COLUMN "last_activity_at" TIMESTAMP(3);

-- Create Note model
CREATE TABLE "notes" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- Create ActivityLog model
CREATE TABLE "activity_logs" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "action" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "actor_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "notes" ADD CONSTRAINT "notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "notes_lead_id_idx" ON "notes"("lead_id");
CREATE INDEX "notes_author_id_idx" ON "notes"("author_id");
CREATE INDEX "activity_logs_lead_id_idx" ON "activity_logs"("lead_id");
CREATE INDEX "activity_logs_actor_id_idx" ON "activity_logs"("actor_id");
CREATE INDEX "leads_tier_idx" ON "leads"("tier");
CREATE INDEX "leads_urgency_score_idx" ON "leads"("urgency_score");
CREATE INDEX "leads_is_priority_idx" ON "leads"("is_priority");
CREATE INDEX "leads_last_activity_at_idx" ON "leads"("last_activity_at");