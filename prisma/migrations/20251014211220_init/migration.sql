/*
  Warnings:

  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'BOUNCED', 'COMPLAINED', 'FAILED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('DELIVERED', 'BOUNCED', 'COMPLAINED', 'OPENED', 'CLICKED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('EMAIL', 'SMS', 'MULTI_CHANNEL');

-- DropForeignKey
ALTER TABLE "engagement_metrics" DROP CONSTRAINT "engagement_metrics_message_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_lead_id_fkey";

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "type" "CampaignType" NOT NULL DEFAULT 'EMAIL';

-- DropTable
DROP TABLE "messages";

-- CreateTable
CREATE TABLE "InboundMessage" (
    "id" TEXT NOT NULL,
    "originalMsgId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "inReplyTo" TEXT,
    "references" TEXT,
    "fromEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "htmlBody" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "campaignId" TEXT,
    "sequenceStepId" TEXT,
    "messageId" TEXT NOT NULL,
    "trackingToken" TEXT NOT NULL,
    "inReplyTo" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "clickUrl" TEXT,
    "bounceType" TEXT,
    "metadata" JSONB,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignSequence" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "delayHours" INTEGER NOT NULL DEFAULT 0,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "CampaignSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InboundMessage_messageId_key" ON "InboundMessage"("messageId");

-- CreateIndex
CREATE INDEX "InboundMessage_leadId_idx" ON "InboundMessage"("leadId");

-- CreateIndex
CREATE INDEX "InboundMessage_originalMsgId_idx" ON "InboundMessage"("originalMsgId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_messageId_key" ON "Message"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_trackingToken_key" ON "Message"("trackingToken");

-- CreateIndex
CREATE INDEX "Message_leadId_idx" ON "Message"("leadId");

-- CreateIndex
CREATE INDEX "Message_campaignId_idx" ON "Message"("campaignId");

-- CreateIndex
CREATE INDEX "Message_status_idx" ON "Message"("status");

-- CreateIndex
CREATE INDEX "Message_scheduledFor_idx" ON "Message"("scheduledFor");

-- CreateIndex
CREATE INDEX "EmailEvent_messageId_idx" ON "EmailEvent"("messageId");

-- CreateIndex
CREATE INDEX "EmailEvent_eventType_idx" ON "EmailEvent"("eventType");

-- CreateIndex
CREATE INDEX "EmailEvent_timestamp_idx" ON "EmailEvent"("timestamp");

-- CreateIndex
CREATE INDEX "CampaignSequence_campaignId_idx" ON "CampaignSequence"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignSequence_campaignId_stepNumber_key" ON "CampaignSequence"("campaignId", "stepNumber");

-- AddForeignKey
ALTER TABLE "InboundMessage" ADD CONSTRAINT "InboundMessage_originalMsgId_fkey" FOREIGN KEY ("originalMsgId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundMessage" ADD CONSTRAINT "InboundMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_metrics" ADD CONSTRAINT "engagement_metrics_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSequence" ADD CONSTRAINT "CampaignSequence_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSequence" ADD CONSTRAINT "CampaignSequence_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
