import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, lead } = body

    if (!process.env.SLACK_WEBHOOK_URL) {
      console.log('⚠️ No Slack webhook configured')
      return NextResponse.json({ skipped: true })
    }

    const slackMessage = {
      text: "🚨 NEW LEAD RECEIVED!",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🚨 New Lead Received!"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Service:*\n${lead.service}`
            },
            {
              type: "mrkdwn",
              text: `*ZIP Code:*\n${lead.zip}`
            },
            {
              type: "mrkdwn",
              text: `*Name:*\n${lead.name}`
            },
            {
              type: "mrkdwn",
              text: `*Phone:*\n${lead.phone}`
            },
            {
              type: "mrkdwn",
              text: `*Email:*\n${lead.email}`
            },
            {
              type: "mrkdwn",
              text: `*Submitted:*\n${new Date().toLocaleString()}`
            }
          ]
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "📋 Assign Lead"
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/leads`,
              style: "primary"
            }
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Lead ID: ${lead.id}`
            }
          ]
        }
      ]
    }

    const slackResponse = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    })

    if (slackResponse.ok) {
      console.log('✅ Slack notification sent')
      return NextResponse.json({ success: true })
    } else {
      console.error('❌ Slack notification failed:', await slackResponse.text())
      return NextResponse.json({ error: 'Slack send failed' }, { status: 500 })
    }

  } catch (error) {
    console.error('Error sending Slack notification:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
