import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { emailConfig } from '@/lib/config/email.config';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';

const sesClient = new SESClient({
  region: emailConfig.ses.region,
  credentials: {
    accessKeyId: emailConfig.ses.accessKeyId,
    secretAccessKey: emailConfig.ses.secretAccessKey,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  leadId: string;
  campaignId?: string;
  replyTo?: string;
}

export class SESService {
  static async sendEmail(params: SendEmailParams) {
    const { to, subject, body, leadId, campaignId, replyTo } = params;

    const trackingToken = nanoid(32);
    const messageId = `${nanoid(16)}@${emailConfig.tracking.domain}`;

    const trackedBody = this.injectTracking(body, trackingToken);

    const message = await prisma.message.create({
      data: {
        leadId,
        campaignId,
        messageId,
        trackingToken,
        subject,
        body: trackedBody,
        fromEmail: emailConfig.ses.fromEmail,
        toEmail: to,
        status: 'SENDING',
      },
    });

    try {
      const command = new SendEmailCommand({
        Source: `${emailConfig.ses.fromName} <${emailConfig.ses.fromEmail}>`,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: trackedBody,
              Charset: 'UTF-8',
            },
          },
        },
        ReplyToAddresses: [replyTo || emailConfig.ses.replyToEmail || emailConfig.ses.fromEmail],
        ConfigurationSetName: emailConfig.ses.configurationSet,
      });

      const response = await sesClient.send(command);

      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      console.log(`✅ Email sent to ${to} | MessageID: ${response.MessageId}`);

      return {
        success: true,
        messageId: message.id,
        sesMessageId: response.MessageId,
      };
    } catch (error) {
      console.error('❌ SES sending failed:', error);

      await prisma.message.update({
        where: { id: message.id },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  private static injectTracking(htmlBody: string, trackingToken: string): string {
    let tracked = htmlBody;

    const trackingPixel = `<img src="${emailConfig.tracking.appUrl}/api/tracking/pixel/${trackingToken}.png" width="1" height="1" style="display:none" alt="" />`;
    
    if (tracked.includes('</body>')) {
      tracked = tracked.replace('</body>', `${trackingPixel}</body>`);
    } else {
      tracked += trackingPixel;
    }

    tracked = tracked.replace(
      /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi,
      (match, attributes, url) => {
        if (url.includes('/api/tracking/click/') || url.startsWith('mailto:') || url.startsWith('tel:')) {
          return match;
        }

        const encodedUrl = encodeURIComponent(url);
        const trackingUrl = `${emailConfig.tracking.appUrl}/api/tracking/click/${trackingToken}?url=${encodedUrl}`;
        
        return `<a ${attributes.replace(url, trackingUrl)}>`;
      }
    );

    return tracked;
  }
}
