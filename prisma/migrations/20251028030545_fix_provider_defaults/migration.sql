/*
  Warnings:

  - You are about to drop the column `customerPreferredDate` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `providerProposedDate` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `schedulingNotes` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `schedulingStatus` on the `leads` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Provider" ALTER COLUMN "serviceTypes" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "serviceAreas" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "yearsInBusiness" SET DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'active',
ALTER COLUMN "leadCapacity" SET DEFAULT 10,
ALTER COLUMN "rating" SET DEFAULT 4.5,
ALTER COLUMN "averageJobValue" SET DEFAULT 5000;

-- AlterTable
ALTER TABLE "leads" DROP COLUMN "customerPreferredDate",
DROP COLUMN "providerProposedDate",
DROP COLUMN "schedulingNotes",
DROP COLUMN "schedulingStatus",
ADD COLUMN     "customer_preferred_date" TIMESTAMP(3),
ADD COLUMN     "provider_proposed_date" TIMESTAMP(3),
ADD COLUMN     "scheduling_notes" TEXT,
ADD COLUMN     "scheduling_status" TEXT;
