import { resend } from '@/lib/resend-server';

export interface NotificationTemplate {
  sms: string;
  email: {
    subject: string;
    body: string;
  };
}

export interface NotificationContext {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  providerName: string;
  providerCompany?: string;
  serviceType: string;
  jobDate?: string;
  jobTime?: string;
  amount?: number;
  trackingLink?: string;
  photosLink?: string;
  invoiceLink?: string;
  paymentLink?: string;
  ratingLink?: string;
}

export type NotificationType =
  | 'job_scheduled'
  | 'lead_accepted'
  | 'reminder_24h'
  | 'provider_on_way'
  | 'job_complete'
  | 'invoice_sent'
  | 'payment_received'
  | 'payment_failed';

// Notification templates
export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  job_scheduled: {
    sms: "Hi {customerName}! Your {serviceType} with {providerCompany} is scheduled for {jobDate} at {jobTime}. Reply with questions!",
    email: {
      subject: "Your {serviceType} is Scheduled",
      body: `
        <h2>Job Confirmed</h2>
        <p>Hi {customerName},</p>
        <p>Your <strong>{serviceType}</strong> service has been scheduled!</p>
        <p><strong>Date & Time:</strong> {jobDate} at {jobTime}</p>
        <p><strong>Provider:</strong> {providerName}</p>
        <p>If you have any questions, feel free to reply to this email or call us.</p>
        <p>We look forward to serving you!</p>
      `
    }
  },

  lead_accepted: {
    sms: "{providerName} accepted your request! They'll contact you shortly.",
    email: {
      subject: "{providerName} Accepted Your Service Request",
      body: `
        <h2>Great News!</h2>
        <p>Hi {customerName},</p>
        <p><strong>{providerName}</strong> has accepted your {serviceType} service request.</p>
        <p>They will be reaching out to you shortly to schedule a time that works for both of you.</p>
        <p>In the meantime, feel free to message them directly through your customer portal.</p>
        <p>Thank you for choosing our platform!</p>
      `
    }
  },

  reminder_24h: {
    sms: "Reminder: {providerName} will arrive tomorrow at {jobTime} for {serviceType}. Reply to confirm or reschedule.",
    email: {
      subject: "Reminder: Your {serviceType} is Tomorrow",
      body: `
        <h2>Tomorrow's Appointment</h2>
        <p>Hi {customerName},</p>
        <p>This is a friendly reminder about your upcoming service:</p>
        <p><strong>Service:</strong> {serviceType}</p>
        <p><strong>Date:</strong> Tomorrow at {jobTime}</p>
        <p><strong>Provider:</strong> {providerName}</p>
        <p>If you need to reschedule or have any questions, please reply to this email or contact us as soon as possible.</p>
        <p>See you tomorrow!</p>
      `
    }
  },

  provider_on_way: {
    sms: "{providerName} is on the way to your location! ETA: 15 minutes.",
    email: {
      subject: "{providerName} is On The Way",
      body: `
        <h2>Provider En Route</h2>
        <p>Hi {customerName},</p>
        <p><strong>{providerName}</strong> is on the way to your location!</p>
        <p><strong>Estimated arrival:</strong> 15 minutes</p>
        <p>They'll be there soon to complete your {serviceType} service.</p>
        <p>If you have any last-minute questions, feel free to call them directly.</p>
      `
    }
  },

  job_complete: {
    sms: "Great news! {providerName} marked your job as complete. View photos and approve: {photosLink}",
    email: {
      subject: "Your {serviceType} is Complete!",
      body: `
        <h2>Job Completed</h2>
        <p>Hi {customerName},</p>
        <p>Great news! <strong>{providerName}</strong> has marked your {serviceType} service as complete.</p>
        <p>You can view the before and after photos and approve the work by clicking the link below:</p>
        <p><a href="{photosLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Photos & Approve</a></p>
        <p>If you have any concerns or questions about the work, please don't hesitate to reach out.</p>
        <p>Thank you for your business!</p>
      `
    }
  },

  invoice_sent: {
    sms: "Invoice ready: {amount} for {serviceType}. Pay now: {paymentLink}",
    email: {
      subject: "Invoice for Your {serviceType} Service",
      body: `
        <h2>Invoice</h2>
        <p>Hi {customerName},</p>
        <p>Your invoice is ready for the {serviceType} service completed by {providerName}.</p>
        <p><strong>Amount Due:</strong> {amount}</p>
        <p>You can view the full invoice and make a payment by clicking below:</p>
        <p><a href="{invoiceLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Invoice</a></p>
        <p><a href="{paymentLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-left: 10px;">Pay Now</a></p>
        <p>Thank you for your business!</p>
      `
    }
  },

  payment_received: {
    sms: "Payment received! Thank you for choosing {providerName}. Rate your experience: {ratingLink}",
    email: {
      subject: "Payment Received - Thank You!",
      body: `
        <h2>Payment Confirmed</h2>
        <p>Hi {customerName},</p>
        <p>We've received your payment of <strong>{amount}</strong> for your {serviceType} service.</p>
        <p>Thank you for choosing {providerName}! We hope you're satisfied with the work.</p>
        <p>We'd love to hear about your experience. Please take a moment to rate your service:</p>
        <p><a href="{ratingLink}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Rate Your Experience</a></p>
        <p>Your feedback helps us improve and helps other customers make informed decisions.</p>
        <p>We look forward to serving you again!</p>
      `
    }
  },

  payment_failed: {
    sms: "Payment failed for invoice {invoiceLink}. Please update payment method and try again.",
    email: {
      subject: "Payment Failed - Action Required",
      body: `
        <h2>Payment Failed</h2>
        <p>Hi {customerName},</p>
        <p>Unfortunately, we were unable to process your payment for invoice.</p>
        <p><strong>Error:</strong> {amount}</p>
        <p>Please update your payment method and try again:</p>
        <p><a href="{invoiceLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Retry Payment</a></p>
        <p>If you continue to experience issues, please contact {providerName} directly.</p>
        <p>Thank you for your attention to this matter.</p>
      `
    }
  }
};

// Replace template variables with actual values
function replaceTemplateVariables(template: string, context: NotificationContext): string {
  let result = template;

  Object.entries(context).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, value?.toString() || '');
  });

  return result;
}

// Check if within quiet hours (9 PM - 8 AM)
function isQuietHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 21 || hour < 8;
}

// Send SMS notification (placeholder for Twilio integration)
async function sendSMS(phone: string, message: string): Promise<boolean> {
  // TODO: Integrate with Twilio
  console.log('📱 SMS would be sent to:', phone);
  console.log('Message:', message);

  // For now, just log and return success
  // In production, this would use Twilio:
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   body: message,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phone
  // });

  return true;
}

// Send email notification
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    await resend.emails.send({
      from: 'Renoa <noreply@renoa.com>',
      to,
      subject,
      html,
    });

    console.log('📧 Email sent to:', to);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Main notification sending function
export async function sendNotification(
  type: NotificationType,
  context: NotificationContext,
  options: {
    sendSMS?: boolean;
    sendEmail?: boolean;
    respectQuietHours?: boolean;
  } = {}
): Promise<{
  smsSuccess: boolean;
  emailSuccess: boolean;
  skippedDueToQuietHours: boolean;
}> {
  const {
    sendSMS: shouldSendSMS = true,
    sendEmail: shouldSendEmail = true,
    respectQuietHours = true,
  } = options;

  // Check quiet hours for SMS only
  const quietHours = respectQuietHours && isQuietHours();

  const template = NOTIFICATION_TEMPLATES[type];

  // Send SMS
  let smsSuccess = false;
  if (shouldSendSMS && !quietHours) {
    const smsMessage = replaceTemplateVariables(template.sms, context);
    smsSuccess = await sendSMS(context.customerPhone, smsMessage);
  }

  // Send Email (not affected by quiet hours)
  let emailSuccess = false;
  if (shouldSendEmail) {
    const subject = replaceTemplateVariables(template.email.subject, context);
    const body = replaceTemplateVariables(template.email.body, context);
    emailSuccess = await sendEmail(context.customerEmail, subject, body);
  }

  return {
    smsSuccess,
    emailSuccess,
    skippedDueToQuietHours: quietHours && shouldSendSMS,
  };
}

// Helper function to format date for notifications
export function formatJobDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Helper function to format time for notifications
export function formatJobTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
