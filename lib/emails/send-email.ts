import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendLeadAssignmentEmailParams {
  to: string;
  providerName: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  leadAddress: string;
  leadCity: string;
  leadState: string;
  service: string;
  leadScore: number;
  propertyValue: number | null;
  notes: string | null;
}

export async function sendLeadAssignmentEmail(params: SendLeadAssignmentEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Renoa.ai <onboarding@resend.dev>',
      to: params.to,
      subject: `🎯 New Lead Assigned: ${params.leadName} - ${params.service}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 30px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .lead-info {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #10b981;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .label {
                font-weight: 600;
                color: #6b7280;
              }
              .value {
                color: #111827;
                font-weight: 500;
              }
              .score-badge {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
              }
              .cta-button {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
              .tips-box {
                margin-top: 30px;
                padding: 20px;
                background: #fef3c7;
                border-radius: 8px;
                border-left: 4px solid #f59e0b;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎯 New Lead Assigned!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                You've been matched with a high-quality lead
              </p>
            </div>
            
            <div class="content">
              <p style="font-size: 16px; margin-top: 0;">
                Hi <strong>${params.providerName}</strong>,
              </p>
              
              <p>
                Great news! Our AI has matched you with a new lead based on your expertise, 
                location, and performance history. Here are the details:
              </p>

              <div class="lead-info">
                <h2 style="margin-top: 0; color: #10b981;">Lead Information</h2>
                
                <div class="info-row">
                  <span class="label">Name:</span>
                  <span class="value">${params.leadName}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${params.leadEmail}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Phone:</span>
                  <span class="value">${params.leadPhone}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Location:</span>
                  <span class="value">${params.leadAddress}, ${params.leadCity}, ${params.leadState}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Service Needed:</span>
                  <span class="value" style="text-transform: capitalize;">${params.service}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Lead Quality Score:</span>
                  <span class="score-badge">${params.leadScore}/100</span>
                </div>
                
                ${params.propertyValue ? `
                  <div class="info-row">
                    <span class="label">Property Value:</span>
                    <span class="value" style="color: #10b981; font-weight: bold;">
                      $${params.propertyValue.toLocaleString()}
                    </span>
                  </div>
                ` : ''}
                
                ${params.notes ? `
                  <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 6px;">
                    <strong style="color: #6b7280;">Additional Notes:</strong>
                    <p style="margin: 8px 0 0 0;">${params.notes}</p>
                  </div>
                ` : ''}
              </div>

              <div style="text-align: center;">
                <a href="http://localhost:3000/provider/dashboard" class="cta-button">
                  View in Dashboard →
                </a>
              </div>

              <div class="tips-box">
                <h3 style="margin: 0 0 10px 0; color: #92400e;">⚡ Quick Tips</h3>
                <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                  <li>Respond within 2 hours for best results</li>
                  <li>Personalize your outreach based on their needs</li>
                  <li>Highlight your expertise in ${params.service}</li>
                </ul>
              </div>
            </div>

            <div class="footer">
              <p>
                This lead was assigned to you via Renoa.ai's AI matching system<br/>
                Questions? Reply to this email or contact support.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}