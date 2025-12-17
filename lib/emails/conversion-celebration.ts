import { resend } from '@/lib/resend-server';

interface SendConversionEmailParams {
  to: string;
  providerName: string;
  leadName: string;
  totalConversions: number;
  conversionRate: number;
  totalRevenue?: number;
}

export async function sendConversionCelebrationEmail(params: SendConversionEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Renoa.ai <onboarding@resend.dev>',
      to: params.to,
      subject: `🎉 Congrats! ${params.leadName} Converted!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
                color: white;
                padding: 40px;
                border-radius: 12px;
                text-align: center;
              }
              .emoji {
                font-size: 64px;
                margin-bottom: 10px;
              }
              .content {
                background: white;
                padding: 30px;
                border-radius: 12px;
                margin-top: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .stats {
                display: flex;
                justify-content: space-around;
                margin: 30px 0;
                padding: 20px;
                background: #f9fafb;
                border-radius: 8px;
              }
              .stat {
                text-align: center;
              }
              .stat-value {
                font-size: 32px;
                font-weight: bold;
                color: #8b5cf6;
              }
              .stat-label {
                font-size: 14px;
                color: #6b7280;
                margin-top: 5px;
              }
              .message {
                font-size: 18px;
                line-height: 1.8;
                color: #374151;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="emoji">🎉🎊</div>
              <h1 style="margin: 0; font-size: 32px;">Awesome Work, ${params.providerName}!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">
                ${params.leadName} just converted!
              </p>
            </div>
            
            <div class="content">
              <p class="message">
                Another one in the books! You're crushing it. Keep up the excellent work and watch those numbers grow! 🚀
              </p>

              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${params.totalConversions}</div>
                  <div class="stat-label">Total Conversions</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${(params.conversionRate * 100).toFixed(1)}%</div>
                  <div class="stat-label">Conversion Rate</div>
                </div>
              </div>

              <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
                Keep delivering amazing service! 💪
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending celebration email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending celebration email:', error);
    return { success: false, error };
  }
}