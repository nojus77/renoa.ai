-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "advanceBooking" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "availabilityNotes" TEXT,
ADD COLUMN     "bufferTime" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'America/Chicago',
ADD COLUMN     "workingHours" JSONB;
