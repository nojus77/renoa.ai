-- DropForeignKey
ALTER TABLE "public"."campaigns" DROP CONSTRAINT "campaigns_created_by_fkey";

-- AlterTable
ALTER TABLE "campaigns" ALTER COLUMN "created_by" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
