import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { addDays } from 'date-fns';

interface CompleteJobRequest {
  checklistCompleted: Record<string, boolean>;
  completionPhotos: string[];
  actualDurationMinutes: number | null;
  signatureDataUrl: string | null;
  signedByName: string | null;
  skipSignature: boolean;
  completionNotes: string;
  completedByUserId?: string;
  createInvoice?: boolean;
}

/**
 * POST /api/provider/jobs/[id]/complete
 * Complete a job with checklist, signature, photos, and optionally create invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body: CompleteJobRequest = await request.json();

    const {
      checklistCompleted,
      completionPhotos,
      actualDurationMinutes,
      signatureDataUrl,
      signedByName,
      skipSignature,
      completionNotes,
      completedByUserId,
      createInvoice = true,
    } = body;

    // Get the job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: true,
        provider: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Upload signature to blob storage if provided
    let signatureUrl: string | null = null;
    if (signatureDataUrl && !skipSignature) {
      try {
        // Convert base64 to buffer
        const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload to Vercel Blob
        const blob = await put(`signatures/${jobId}.png`, buffer, {
          access: 'public',
          contentType: 'image/png',
        });

        signatureUrl = blob.url;
      } catch (uploadError) {
        console.error('[Complete Job] Signature upload error:', uploadError);
        // Continue without signature URL if upload fails
      }
    }

    // Use transaction to ensure all database writes succeed or fail together
    const { completionData, invoice } = await prisma.$transaction(async (tx) => {
      // Create or update job completion data
      const completionData = await tx.jobCompletionData.upsert({
        where: { jobId },
        update: {
          checklistCompleted,
          completionPhotos,
          signatureUrl,
          signedByName: skipSignature ? null : signedByName,
          signedAt: skipSignature ? null : new Date(),
          completionNotes,
        },
        create: {
          jobId,
          checklistCompleted,
          completionPhotos,
          signatureUrl,
          signedByName: skipSignature ? null : signedByName,
          signedAt: skipSignature ? null : new Date(),
          completionNotes,
        },
      });

      // Update job status
      await tx.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          completedByUserId,
          actualDurationMinutes,
        },
      });

      // Create invoice if requested
      let invoice = null;
      if (createInvoice && job.estimatedValue) {
        // Generate invoice number
        const invoiceCount = await tx.invoice.count({
          where: { providerId: job.providerId },
        });
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

        const subtotal = job.actualValue || job.estimatedValue;
        const taxRate = 0; // Could be configurable per provider
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            providerId: job.providerId,
            customerId: job.customerId,
            jobId: job.id,
            status: 'sent',
            invoiceDate: new Date(),
            dueDate: addDays(new Date(), 30),
            subtotal,
            taxRate,
            taxAmount,
            total,
            notes: `Service: ${job.serviceType}\nAddress: ${job.address}`,
            lineItems: {
              create: [
                {
                  description: job.serviceType,
                  quantity: 1,
                  unitPrice: subtotal,
                  total: subtotal,
                  order: 0,
                },
              ],
            },
          },
        });
      }

      return { completionData, invoice };
    });

    // TODO: Send completion email to customer
    // await sendCompletionEmail(job, invoice);

    return NextResponse.json({
      success: true,
      completionData,
      invoice: invoice ? {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
      } : null,
    });
  } catch (error) {
    console.error('[Complete Job API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to complete job' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/provider/jobs/[id]/complete
 * Get completion data for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const completionData = await prisma.jobCompletionData.findUnique({
      where: { jobId },
    });

    if (!completionData) {
      return NextResponse.json({ completionData: null });
    }

    return NextResponse.json({ completionData });
  } catch (error) {
    console.error('[Complete Job API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch completion data' },
      { status: 500 }
    );
  }
}
