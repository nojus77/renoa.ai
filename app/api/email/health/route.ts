import { NextResponse } from 'next/server'
import { checkSesHealth } from '@/lib/email/ses'

export const dynamic = 'force-dynamic'

export async function GET() {
  const health = await checkSesHealth()
  if (health.ok) {
    return NextResponse.json({ status: 'ok', ...health })
  }
  
  // Return 200 for configuration warnings, 500 for actual errors
  const statusCode = ('configured' in health && !health.configured) ? 200 : 500
  return NextResponse.json({ status: 'error', ...health }, { status: statusCode })
}
