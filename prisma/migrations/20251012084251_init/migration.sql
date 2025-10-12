-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('homeowner', 'provider', 'admin');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('single_family', 'condo', 'townhouse', 'multi_family');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('landscaping', 'remodeling', 'roofing', 'fencing', 'hvac', 'plumbing', 'painting', 'flooring');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'replied', 'matched', 'converted', 'unqualified');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "SequenceType" AS ENUM ('sms_sms_email', 'email_sms_email', 'sms_email', 'custom');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('sms', 'email');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('scheduled', 'sent', 'delivered', 'failed', 'bounced');

-- CreateEnum
CREATE TYPE "ReplySentiment" AS ENUM ('positive', 'neutral', 'negative', 'question');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'basic', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "PriceRange" AS ENUM ('budget', 'mid_range', 'premium', 'luxury');

-- CreateEnum
CREATE TYPE "CapacityStatus" AS ENUM ('accepting', 'limited', 'full');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('pending', 'sent_to_provider', 'accepted', 'declined', 'contacted', 'closed_won', 'closed_lost');

-- CreateEnum
CREATE TYPE "OptimizationType" AS ENUM ('message_template', 'send_timing', 'lead_scoring', 'matching_criteria');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "property_type" "PropertyType" NOT NULL,
    "property_value" DECIMAL(65,30),
    "square_footage" INTEGER,
    "move_in_date" TIMESTAMP(3),
    "service_interest" "ServiceCategory" NOT NULL,
    "lead_source" TEXT NOT NULL,
    "lead_score" INTEGER NOT NULL DEFAULT 0,
    "tier" INTEGER NOT NULL,
    "campaign" TEXT,
    "contact_count" INTEGER NOT NULL DEFAULT 0,
    "urgencyScore" INTEGER,
    "propertyScore" INTEGER,
    "financialScore" INTEGER,
    "demographicScore" INTEGER,
    "marketScore" INTEGER,
    "urgency_reasons" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "ai_tool_1_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "service_type" "ServiceCategory" NOT NULL,
    "target_audience" JSONB NOT NULL,
    "sequence_type" "SequenceType" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "total_leads" INTEGER NOT NULL DEFAULT 0,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "opened_count" INTEGER NOT NULL DEFAULT 0,
    "replied_count" INTEGER NOT NULL DEFAULT 0,
    "converted_count" INTEGER NOT NULL DEFAULT 0,
    "scheduled_start" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL,
    "sequence_step" INTEGER NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'scheduled',
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "provider_message_id" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_metrics" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "reply_text" TEXT,
    "reply_sentiment" "ReplySentiment",
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "replied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engagement_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_providers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "service_categories" "ServiceCategory"[],
    "coverage_areas" JSONB NOT NULL,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'free',
    "price_range" "PriceRange" NOT NULL,
    "specializations" TEXT[],
    "capacity_status" "CapacityStatus" NOT NULL DEFAULT 'accepting',
    "leads_received_count" INTEGER NOT NULL DEFAULT 0,
    "leads_converted_count" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "match_score" INTEGER NOT NULL,
    "match_reason" JSONB NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'pending',
    "lead_price" DECIMAL(65,30),
    "deal_value" DECIMAL(65,30),
    "commission_amount" DECIMAL(65,30),
    "provider_notified_at" TIMESTAMP(3),
    "provider_response_at" TIMESTAMP(3),
    "deal_closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "service_category" "ServiceCategory",
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "performance_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "times_used" INTEGER NOT NULL DEFAULT 0,
    "avg_reply_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_optimizations" (
    "id" TEXT NOT NULL,
    "optimization_type" "OptimizationType" NOT NULL,
    "before_metric" JSONB NOT NULL,
    "after_metric" JSONB NOT NULL,
    "improvement_percentage" DECIMAL(5,2) NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_optimizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_zip_idx" ON "leads"("zip");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_service_interest_idx" ON "leads"("service_interest");

-- CreateIndex
CREATE INDEX "leads_lead_score_idx" ON "leads"("lead_score");

-- CreateIndex
CREATE INDEX "leads_tier_idx" ON "leads"("tier");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");

-- CreateIndex
CREATE INDEX "leads_updated_at_idx" ON "leads"("updated_at");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_service_type_idx" ON "campaigns"("service_type");

-- CreateIndex
CREATE INDEX "messages_campaign_id_idx" ON "messages"("campaign_id");

-- CreateIndex
CREATE INDEX "messages_lead_id_idx" ON "messages"("lead_id");

-- CreateIndex
CREATE INDEX "messages_status_idx" ON "messages"("status");

-- CreateIndex
CREATE INDEX "engagement_metrics_message_id_idx" ON "engagement_metrics"("message_id");

-- CreateIndex
CREATE INDEX "engagement_metrics_lead_id_idx" ON "engagement_metrics"("lead_id");

-- CreateIndex
CREATE INDEX "engagement_metrics_campaign_id_idx" ON "engagement_metrics"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_providers_user_id_key" ON "service_providers"("user_id");

-- CreateIndex
CREATE INDEX "service_providers_subscription_tier_idx" ON "service_providers"("subscription_tier");

-- CreateIndex
CREATE INDEX "service_providers_is_active_idx" ON "service_providers"("is_active");

-- CreateIndex
CREATE INDEX "matches_lead_id_idx" ON "matches"("lead_id");

-- CreateIndex
CREATE INDEX "matches_provider_id_idx" ON "matches"("provider_id");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE INDEX "message_templates_type_idx" ON "message_templates"("type");

-- CreateIndex
CREATE INDEX "message_templates_is_active_idx" ON "message_templates"("is_active");

-- CreateIndex
CREATE INDEX "ai_optimizations_optimization_type_idx" ON "ai_optimizations"("optimization_type");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_metrics" ADD CONSTRAINT "engagement_metrics_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_metrics" ADD CONSTRAINT "engagement_metrics_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_metrics" ADD CONSTRAINT "engagement_metrics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
