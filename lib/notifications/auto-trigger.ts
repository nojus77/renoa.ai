import { NotificationType } from './notification-service';

// Automatically determine which notification to send based on job status change
export async function triggerNotificationForStatusChange(
  leadId: string,
  providerId: string,
  oldStatus: string | null,
  newStatus: string
): Promise<void> {
  let notificationType: NotificationType | null = null;

  // Determine notification type based on status change
  if (oldStatus === 'matched' && newStatus === 'accepted') {
    notificationType = 'lead_accepted';
  } else if (newStatus === 'scheduled' || (oldStatus === 'accepted' && newStatus === 'confirmed')) {
    notificationType = 'job_scheduled';
  } else if (newStatus === 'in_progress') {
    notificationType = 'provider_on_way';
  } else if (newStatus === 'completed') {
    notificationType = 'job_complete';
  }

  if (!notificationType) {
    return;
  }

  // Send notification
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/provider/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: notificationType,
        leadId,
        providerId,
      }),
    });

    console.log(`✅ Auto-triggered ${notificationType} notification for lead ${leadId}`);
  } catch (error) {
    console.error('Failed to trigger notification:', error);
  }
}

// Schedule 24-hour reminder for a job
export async function schedule24HourReminder(
  leadId: string,
  providerId: string,
  jobDate: Date
): Promise<void> {
  const now = new Date();
  const reminderTime = new Date(jobDate);
  reminderTime.setHours(reminderTime.getHours() - 24);

  const msUntilReminder = reminderTime.getTime() - now.getTime();

  // Only schedule if reminder time is in the future
  if (msUntilReminder > 0) {
    // In production, use a proper job queue like Bull or Agenda
    // For now, use setTimeout (this will be lost on server restart)
    setTimeout(async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/provider/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'reminder_24h',
            leadId,
            providerId,
          }),
        });

        console.log(`✅ Sent 24-hour reminder for lead ${leadId}`);
      } catch (error) {
        console.error('Failed to send reminder:', error);
      }
    }, msUntilReminder);

    console.log(`⏰ Scheduled 24-hour reminder for lead ${leadId} at ${reminderTime.toISOString()}`);
  }
}

// Trigger invoice sent notification
export async function triggerInvoiceSentNotification(
  leadId: string,
  providerId: string,
  amount: number
): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/provider/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'invoice_sent',
        leadId,
        providerId,
        customContext: { amount },
      }),
    });

    console.log(`✅ Sent invoice notification for lead ${leadId}`);
  } catch (error) {
    console.error('Failed to send invoice notification:', error);
  }
}

// Trigger payment received notification
export async function triggerPaymentReceivedNotification(
  leadId: string,
  providerId: string,
  amount: number
): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/provider/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment_received',
        leadId,
        providerId,
        customContext: { amount },
      }),
    });

    console.log(`✅ Sent payment received notification for lead ${leadId}`);
  } catch (error) {
    console.error('Failed to send payment notification:', error);
  }
}
