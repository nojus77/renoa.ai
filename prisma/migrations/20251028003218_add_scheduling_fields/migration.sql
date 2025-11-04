/*
  Warnings:

  - You are about to drop the column `providerId` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `commission_amount` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `deal_value` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `lead_price` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `match_reason` on the `matches` table. All the data in the column will be lost.
  - You are about to alter the column `match_score` on the `matches` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to drop the `providers` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "LeadStatus" ADD VALUE 'accepted';

-- DropForeignKey
ALTER TABLE "public"."leads" DROP CONSTRAINT "leads_providerId_fkey";

-- DropIndex
DROP INDEX "public"."service_providers_is_active_idx";

-- DropIndex
DROP INDEX "public"."service_providers_subscription_tier_idx";

-- AlterTable
ALTER TABLE "leads" DROP COLUMN "providerId",
ADD COLUMN     "assigned_provider_id" TEXT,
ADD COLUMN     "contract_value" DECIMAL(65,30),
ADD COLUMN     "customerPreferredDate" TIMESTAMP(3),
ADD COLUMN     "providerProposedDate" TIMESTAMP(3),
ADD COLUMN     "schedulingNotes" TEXT,
ADD COLUMN     "schedulingStatus" TEXT;

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "commission_amount",
DROP COLUMN "deal_value",
DROP COLUMN "lead_price",
DROP COLUMN "match_reason",
ADD COLUMN     "estimated_value" DECIMAL(65,30),
ALTER COLUMN "match_score" SET DATA TYPE DECIMAL(5,2);

-- DropTable
DROP TABLE "public"."providers";

-- CreateTable
CREATE TABLE "lead_notes" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "serviceTypes" TEXT[],
    "serviceAreas" TEXT[],
    "yearsInBusiness" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "leadCapacity" INTEGER NOT NULL,
    "currentLeadCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLeadsSent" INTEGER NOT NULL DEFAULT 0,
    "leadsAccepted" INTEGER NOT NULL DEFAULT 0,
    "leadsConverted" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "averageJobValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_notes_lead_id_idx" ON "lead_notes"("lead_id");

-- CreateIndex
CREATE INDEX "lead_notes_provider_id_idx" ON "lead_notes"("provider_id");

-- CreateIndex
CREATE INDEX "lead_notes_created_at_idx" ON "lead_notes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_email_key" ON "Provider"("email");

-- CreateIndex
CREATE INDEX "leads_assigned_provider_id_idx" ON "leads"("assigned_provider_id");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_provider_id_fkey" FOREIGN KEY ("assigned_provider_id") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
