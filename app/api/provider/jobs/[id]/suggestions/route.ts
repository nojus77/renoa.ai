import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { scoreWorkersForJob } from '@/lib/assignment-scoring';

const prisma = new PrismaClient();

/**
 * GET /api/provider/jobs/[id]/suggestions
 * Get smart worker assignment suggestions for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { customer: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.providerId !== providerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get worker suggestions
    const suggestions = await scoreWorkersForJob(jobId, providerId, limit);

    // Calculate job duration
    const durationHours = (job.endTime.getTime() - job.startTime.getTime()) / (1000 * 60 * 60);

    return NextResponse.json({
      success: true,
      jobId,
      jobDetails: {
        serviceType: job.serviceType,
        customerName: job.customer?.name || 'Unknown',
        startTime: job.startTime.toISOString(),
        endTime: job.endTime.toISOString(),
        duration: Math.round(durationHours * 10) / 10,
        address: job.customer?.address || job.address,
        estimatedValue: job.estimatedValue ? Number(job.estimatedValue) : null,
      },
      suggestions,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
