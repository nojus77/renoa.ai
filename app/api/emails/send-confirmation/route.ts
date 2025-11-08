import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendConfirmationRequest {
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    serviceInterest: string;
    city: string;
    state: string;
    zip: string;
    projectDetails?: Record<string, any>;
  };
  estimate?: {
    min: number;
    max: number;
    confidence: string;
    explanation: string;
  };
  assignedProvider?: {
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { lead, estimate, assignedProvider }: SendConfirmationRequest = await request.json();

    console.log('📧 Sending confirmation email to:', lead.email);

    // Format service name for display
    const serviceName = lead.serviceInterest
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Build email HTML
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Renoa Service Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #10b981; font-size: 32px; margin: 0; font-weight: 700;">Renoa</h1>
      <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 14px;">Connecting you with trusted home service providers</p>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">

      <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px 0; font-weight: 600;">We're finding the perfect match for you!</h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Hi ${lead.firstName},
      </p>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
        Thanks for submitting your <strong>${serviceName}</strong> request through Renoa! We've received your information and are working to connect you with the best provider for your needs.
      </p>

      <!-- Project Details Box -->
      <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; margin: 0 0 32px 0;">
        <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Your Project Details</h3>

        <div style="margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Service:</span>
          <span style="color: #1f2937; font-size: 14px; margin-left: 8px; font-weight: 600;">${serviceName}</span>
        </div>

        <div style="margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Location:</span>
          <span style="color: #1f2937; font-size: 14px; margin-left: 8px;">${lead.city}, ${lead.state} ${lead.zip}</span>
        </div>

        ${estimate ? `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
          <div style="margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Estimated Cost Range:</span>
          </div>
          <div style="font-size: 28px; font-weight: 700; color: #10b981; margin-bottom: 12px;">
            $${estimate.min.toLocaleString()} - $${estimate.max.toLocaleString()}
          </div>
          <div style="display: inline-block; padding: 6px 16px; border-radius: 20px; background-color: ${
            estimate.confidence === 'high' ? '#d1fae5' :
            estimate.confidence === 'medium' ? '#fef3c7' : '#fee2e2'
          };">
            <span style="color: ${
              estimate.confidence === 'high' ? '#065f46' :
              estimate.confidence === 'medium' ? '#92400e' : '#991b1b'
            }; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
              ${estimate.confidence} Confidence
            </span>
          </div>
          ${estimate.explanation ? `
          <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 16px 0 0 0;">
            ${estimate.explanation}
          </p>
          ` : ''}
        </div>
        ` : ''}
      </div>

      ${assignedProvider ? `
      <!-- Matched Provider Box -->
      <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 24px; margin: 0 0 32px 0;">
        <h3 style="color: #065f46; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">✓ You've Been Matched!</h3>

        <div style="margin-bottom: 12px;">
          <span style="color: #047857; font-size: 14px; font-weight: 500;">Provider:</span>
          <span style="color: #065f46; font-size: 16px; margin-left: 8px; font-weight: 700;">${assignedProvider.businessName}</span>
        </div>

        <div style="margin-bottom: 12px;">
          <span style="color: #047857; font-size: 14px; font-weight: 500;">Contact:</span>
          <span style="color: #065f46; font-size: 14px; margin-left: 8px;">${assignedProvider.contactName}</span>
        </div>

        ${assignedProvider.phone ? `
        <div style="margin-bottom: 12px;">
          <span style="color: #047857; font-size: 14px; font-weight: 500;">Phone:</span>
          <span style="color: #065f46; font-size: 14px; margin-left: 8px; font-weight: 600;">${assignedProvider.phone}</span>
        </div>
        ` : ''}

        <p style="color: #065f46; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">
          <strong>${assignedProvider.contactName}</strong> from <strong>${assignedProvider.businessName}</strong> will be reaching out to you shortly to discuss your project and schedule a consultation.
        </p>
      </div>
      ` : ''}

      <!-- What Happens Next -->
      <div style="margin: 0 0 32px 0;">
        <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">What happens next:</h3>

        <div style="margin-bottom: 12px;">
          <span style="color: #10b981; font-size: 18px; margin-right: 8px; font-weight: 700;">✓</span>
          <span style="color: #4b5563; font-size: 15px; line-height: 1.6;">We're matching you with top-rated providers in your area</span>
        </div>

        <div style="margin-bottom: 12px;">
          <span style="color: #10b981; font-size: 18px; margin-right: 8px; font-weight: 700;">✓</span>
          <span style="color: #4b5563; font-size: 15px; line-height: 1.6;">You'll receive provider contact information via email within 1 hour</span>
        </div>

        <div style="margin-bottom: 12px;">
          <span style="color: #10b981; font-size: 18px; margin-right: 8px; font-weight: 700;">✓</span>
          <span style="color: #4b5563; font-size: 15px; line-height: 1.6;">The provider will reach out to schedule a free consultation</span>
        </div>

        <div>
          <span style="color: #10b981; font-size: 18px; margin-right: 8px; font-weight: 700;">✓</span>
          <span style="color: #4b5563; font-size: 15px; line-height: 1.6;">Get a detailed quote and timeline for your project</span>
        </div>
      </div>

      <!-- Questions Box -->
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 0 0 24px 0;">
        <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
          <strong>Questions?</strong> Just reply to this email and we'll be happy to help!
        </p>
      </div>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong style="color: #10b981;">The Renoa Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
        This email was sent because you requested a service quote through Renoa.<br>
        If you didn't make this request, please disregard this email.
      </p>
    </div>

  </div>
</body>
</html>
    `.trim();

    // Send email via Resend
    const data = await resend.emails.send({
      from: 'Renoa <welcome@renoa.ai>',
      to: [lead.email],
      subject: `Your ${serviceName} Request - We're Finding You the Perfect Match!`,
      html: emailHTML,
    });

    console.log('✅ Confirmation email sent successfully:', data);

return NextResponse.json({
  success: true,
  messageId: data.data?.id,  // Changed this line
  message: 'Confirmation email sent successfully'
});

  } catch (error: any) {
    console.error('❌ Error sending confirmation email:', error);
    console.error('   Error details:', error.message);

    // Don't fail the lead creation if email fails
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send confirmation email',
        details: error.message
      },
      { status: 200 } // Return 200 so lead creation doesn't fail
    );
  }
}
