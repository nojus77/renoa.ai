export const emailConfig = {
  ses: {
    region: process.env.AWS_SES_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!,
    fromEmail: process.env.SES_FROM_EMAIL!,
    fromName: process.env.SES_FROM_NAME || 'Renoa',
    configurationSet: process.env.SES_CONFIGURATION_SET,
    replyToEmail: process.env.SES_REPLY_TO_EMAIL,
  },
  imap: {
    host: process.env.IMAP_HOST!,
    port: parseInt(process.env.IMAP_PORT || '993'),
    user: process.env.IMAP_USER!,
    password: process.env.IMAP_PASSWORD!,
    tls: process.env.IMAP_TLS === 'true',
    pollInterval: parseInt(process.env.IMAP_POLL_INTERVAL_MS || '60000'),
  },
  tracking: {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    domain: process.env.TRACKING_DOMAIN!,
  },
  webhook: {
    secret: process.env.WEBHOOK_SECRET!,
  },
} as const;
