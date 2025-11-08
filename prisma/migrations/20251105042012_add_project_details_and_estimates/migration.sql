-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ServiceCategory" ADD VALUE 'lawn_care';
ALTER TYPE "ServiceCategory" ADD VALUE 'tree_service';
ALTER TYPE "ServiceCategory" ADD VALUE 'hardscaping';

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "estimate_confidence" TEXT,
ADD COLUMN     "estimated_cost_max" DECIMAL(65,30),
ADD COLUMN     "estimated_cost_min" DECIMAL(65,30),
ADD COLUMN     "project_details" JSONB;
