import { randomBytes } from 'crypto'

export function generateMessageId(domain: string = 'renoa.ai') {
  const unique = randomBytes(8).toString('hex')
  return `<${unique}@${domain}>`
}

export function generateTrackingToken() {
  return randomBytes(12).toString('hex')
}
