/*
  Warnings:

  - You are about to drop the `Provider` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."leads" DROP CONSTRAINT "leads_providerId_fkey";

-- DropTable
DROP TABLE "public"."Provider";

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "service_types" TEXT[],
    "address" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "zip" TEXT NOT NULL DEFAULT '',
    "website" TEXT,
    "rating" DOUBLE PRECISION,
    "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "unpaid_commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "leads_received" INTEGER NOT NULL DEFAULT 0,
    "leads_converted" INTEGER NOT NULL DEFAULT 0,
    "response_time" DOUBLE PRECISION,
    "conversion_rate" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "providers_email_idx" ON "providers"("email");

-- CreateIndex
CREATE INDEX "providers_status_idx" ON "providers"("status");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
