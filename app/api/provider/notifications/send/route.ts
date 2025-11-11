import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  sendNotification,
  NotificationType,
  NotificationContext,
  formatJobDate,
  formatJobTime
} from '@/lib/notifications/notification-service';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      leadId,
      providerId,
      customContext,
    } = body as {
      type: NotificationType;
      leadId: string;
      providerId: string;
      customContext?: Partial<NotificationContext>;
    };

    if (!type || !leadId || !providerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch lead/job details
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Fetch provider details
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Check provider notification preferences
    // TODO: Fetch from provider settings table
    const providerSettings = {
      notificationsEnabled: true,
      smsEnabled: true,
      emailEnabled: true,
      quietHours: true,
    };

    if (!providerSettings.notificationsEnabled) {
      return NextResponse.json({
        success: false,
        message: 'Notifications disabled for this provider',
      });
    }

    // Build notification context
    const context: NotificationContext = {
      customerName: `${lead.firstName} ${lead.lastName}`,
      customerEmail: lead.email,
      customerPhone: lead.phone,
      providerName: provider.businessName || provider.ownerName,
      providerCompany: provider.businessName || provider.ownerName,
      serviceType: lead.serviceInterest || 'service',
      jobDate: lead.providerProposedDate
        ? formatJobDate(lead.providerProposedDate)
        : undefined,
      jobTime: lead.providerProposedDate
        ? formatJobTime(lead.providerProposedDate)
        : undefined,
      amount: lead.contractValue ? Number(lead.contractValue) : undefined,
      trackingLink: `${process.env.NEXT_PUBLIC_BASE_URL}/tracking/${leadId}`,
      photosLink: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${leadId}/photos`,
      invoiceLink: `${process.env.NEXT_PUBLIC_BASE_URL}/invoices/${leadId}`,
      paymentLink: `${process.env.NEXT_PUBLIC_BASE_URL}/pay/${leadId}`,
      ratingLink: `${process.env.NEXT_PUBLIC_BASE_URL}/rate/${leadId}`,
      ...customContext,
    };

    // Send notification
    const result = await sendNotification(type, context, {
      sendSMS: providerSettings.smsEnabled,
      sendEmail: providerSettings.emailEnabled,
      respectQuietHours: providerSettings.quietHours,
    });

    // Log notification
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        notes: `${lead.notes || ''}\n[${new Date().toISOString()}] Notification sent: ${type} (SMS: ${result.smsSuccess}, Email: ${result.emailSuccess})`,
      },
    });

    return NextResponse.json({
      success: true,
      result,
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
