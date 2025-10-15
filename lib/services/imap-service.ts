import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { emailConfig } from '@/lib/config/email.config';
import { prisma } from '@/lib/prisma';

export class IMAPService {
  private imap: Imap;
  private isConnected = false;

  constructor() {
    this.imap = new Imap({
      user: emailConfig.imap.user,
      password: emailConfig.imap.password,
      host: emailConfig.imap.host,
      port: emailConfig.imap.port,
      tls: emailConfig.imap.tls,
      tlsOptions: { rejectUnauthorized: false },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.imap.once('ready', () => {
      console.log('✅ IMAP connection ready');
      this.isConnected = true;
      this.openInbox();
    });

    this.imap.once('error', (err: Error) => {
      console.error('❌ IMAP connection error:', err);
      this.isConnected = false;
    });

    this.imap.once('end', () => {
      console.log('🔌 IMAP connection ended');
      this.isConnected = false;
    });
  }

  connect() {
    if (!this.isConnected) {
      console.log('🔄 Connecting to IMAP...');
      this.imap.connect();
    }
  }

  private openInbox() {
    this.imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        console.error('❌ Error opening inbox:', err);
        return;
      }
      console.log(`📬 Inbox opened: ${box.messages.total} messages`);
      this.fetchUnseenMessages();
    });
  }

  private fetchUnseenMessages() {
    this.imap.search(['UNSEEN'], (err, results) => {
      if (err) {
        console.error('❌ Error searching messages:', err);
        return;
      }

      if (!results || results.length === 0) {
        console.log('📭 No new messages');
        return;
      }

      console.log(`📨 Found ${results.length} new messages`);

      const fetch = this.imap.fetch(results, {
        bodies: '',
        markSeen: true,
      });

      fetch.on('message', (msg) => {
        msg.on('body', (stream) => {
          simpleParser(stream as any, async (err, parsed) => {
            if (err) {
              console.error('❌ Error parsing message:', err);
              return;
            }
            await this.processInboundMessage(parsed);
          });
        });
      });

      fetch.once('error', (err) => {
        console.error('❌ Fetch error:', err);
      });

      fetch.once('end', () => {
        console.log('✅ Done fetching messages');
      });
    });
  }

  private async processInboundMessage(parsed: ParsedMail) {
    try {
      const messageId = parsed.messageId;
      const inReplyTo = parsed.inReplyTo;
      const references = (Array.isArray(parsed.references) ? parsed.references.join(', ') : parsed.references) || null;
      const from = parsed.from?.text || '';
      const subject = parsed.subject || '';
      const textBody = parsed.text || '';
      const htmlBody = parsed.html || null;

      console.log(`📧 Processing reply: ${subject}`);
      console.log(`   From: ${from}`);
      console.log(`   In-Reply-To: ${inReplyTo}`);

      if (!inReplyTo) {
        console.log('⚠️ No In-Reply-To header, skipping');
        return;
      }

      // Try to find the original message by messageId
      const originalMessage = await prisma.message.findFirst({
        where: { messageId: inReplyTo },
        select: { id: true, leadId: true },
      });

      if (!originalMessage) {
        console.log(`⚠️ Original message not found for: ${inReplyTo}`);
        return;
      }

      // Check if we already stored this reply
      const existingReply = await prisma.inboundMessage.findUnique({
        where: { messageId },
      });

      if (existingReply) {
        console.log('ℹ️ Reply already processed');
        return;
      }

      // Store the inbound reply and update lead status in a transaction
      await prisma.$transaction([
        prisma.inboundMessage.create({
          data: {
            originalMsgId: originalMessage.id,
            leadId: originalMessage.leadId,
            messageId: messageId || `unknown-${Date.now()}`,
            inReplyTo: inReplyTo || '',
            references,
            fromEmail: from,
            subject,
            body: textBody,
            htmlBody: htmlBody ? htmlBody.toString() : null,
          },
        }),
        prisma.lead.update({
          where: { id: originalMessage.leadId },
          data: { 
            status: 'replied',
            contactCount: { increment: 1 }
          },
        }),
      ]);

      console.log(`✅ Reply stored for lead: ${originalMessage.leadId}`);
    } catch (error) {
      console.error('❌ Error processing inbound message:', error);
    }
  }

  startPolling(intervalMs?: number) {
    const interval = intervalMs || emailConfig.imap.pollInterval;
    
    console.log(`🔄 Starting IMAP polling every ${interval}ms`);
    
    this.connect();

    setInterval(() => {
      if (this.isConnected) {
        this.fetchUnseenMessages();
      } else {
        console.log('⚠️ Not connected, attempting reconnect...');
        this.connect();
      }
    }, interval);
  }

  disconnect() {
    if (this.isConnected) {
      this.imap.end();
    }
  }
}

// Export a singleton instance
export const imapService = new IMAPService();
