import { SESClient, GetSendQuotaCommand } from '@aws-sdk/client-ses'
import { emailConfig } from '@/lib/config/email.config'

let sesClient: SESClient | null = null

export function getSesClient() {
  if (!sesClient) {
    sesClient = new SESClient({
      region: emailConfig.ses.region,
      credentials: {
        accessKeyId: emailConfig.ses.accessKeyId,
        secretAccessKey: emailConfig.ses.secretAccessKey,
      },
    })
  }
  return sesClient
}

export async function checkSesHealth() {
  // Check if credentials are configured
  const hasCredentials = 
    emailConfig.ses.accessKeyId && 
    emailConfig.ses.accessKeyId !== 'your-access-key-id' &&
    emailConfig.ses.secretAccessKey && 
    emailConfig.ses.secretAccessKey !== 'your-secret-access-key'

  if (!hasCredentials) {
    return {
      ok: false as const,
      configured: false,
      status: 'warning',
      message: 'SES credentials not configured yet. Please update AWS_SES_ACCESS_KEY_ID and AWS_SES_SECRET_ACCESS_KEY in .env',
      region: emailConfig.ses.region || 'not-set',
    }
  }

  const client = getSesClient()
  try {
    const res = await client.send(new GetSendQuotaCommand({}))
    return {
      ok: true as const,
      configured: true,
      region: emailConfig.ses.region,
      max24HourSend: res.Max24HourSend ?? 0,
      maxSendRate: res.MaxSendRate ?? 0,
      sentLast24Hours: res.SentLast24Hours ?? 0,
    }
  } catch (error: any) {
    // Check for credential errors
    const isCredentialError = 
      error?.name === 'InvalidClientTokenId' ||
      error?.name === 'UnrecognizedClientException' ||
      error?.name === 'InvalidAccessKeyId'

    if (isCredentialError) {
      return {
        ok: false as const,
        configured: false,
        status: 'warning',
        message: 'SES credentials are invalid. Please check AWS_SES_ACCESS_KEY_ID and AWS_SES_SECRET_ACCESS_KEY in .env',
        region: emailConfig.ses.region,
      }
    }

    return {
      ok: false as const,
      configured: true,
      region: emailConfig.ses.region,
      error: error?.name || 'SesHealthError',
      message: error?.message || 'Unknown SES error',
    }
  }
}
