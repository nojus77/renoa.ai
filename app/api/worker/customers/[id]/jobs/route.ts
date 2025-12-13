import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/worker/customers/[id]/jobs
 * Get job history for a customer (for workers to see past service history)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get customer's completed jobs
    const jobs = await prisma.job.findMany({
      where: {
        customerId: id,
        status: 'completed',
      },
      orderBy: { startTime: 'desc' },
      take: 20, // Limit to last 20 jobs
      select: {
        id: true,
        serviceType: true,
        startTime: true,
        endTime: true,
        status: true,
        actualValue: true,
        estimatedValue: true,
        internalNotes: true,
        assignedUserIds: true,
      },
    });

    // Get worker names for the jobs
    const workerIds = Array.from(new Set(jobs.flatMap(j => j.assignedUserIds)));
    const workers = await prisma.providerUser.findMany({
      where: { id: { in: workerIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const workerMap = new Map(
      workers.map(w => [w.id, `${w.firstName || ''} ${w.lastName || ''}`.trim()])
    );

    // Transform jobs for worker view
    const transformedJobs = jobs.map(job => {
      const workerNames = job.assignedUserIds
        .map(id => workerMap.get(id) || 'Unknown')
        .filter(Boolean);

      // Parse notes to extract clean content (remove ALL metadata)
      let cleanNotes: string | null = null;
      if (job.internalNotes) {
        let notes = job.internalNotes;

        // Remove patterns like "[Created by Name]", "[12/13/2025, 10:47:29 AM]"
        notes = notes.replace(/\[Created by [^\]]+\]/g, '');
        notes = notes.replace(/\[\d{1,2}\/\d{1,2}\/\d{4},?\s*\d{1,2}:\d{2}:\d{2}\s*(AM|PM)?\]/gi, '');

        // Split into blocks
        const noteBlocks = notes.split('\n\n').filter(Boolean);
        const contentParts: string[] = [];

        for (const block of noteBlocks) {
          // Try to parse the [timestamp] author: content format
          const match = block.match(/^\[([^\]]+)\]\s*[^:]+:\s*([\s\S]+)/);
          if (match) {
            contentParts.push(match[2].trim());
          } else {
            // Try to remove "Name: " prefix at start of line
            let cleaned = block.replace(/^[^:\n]+:\s*/gm, '').trim();
            // Remove bullet points
            cleaned = cleaned.replace(/^[•\-\*]\s*/gm, '').trim();
            // Remove stray parentheses and brackets
            cleaned = cleaned.replace(/^\s*[\(\)\[\]]\s*/gm, '').trim();
            cleaned = cleaned.replace(/\s*[\(\)\[\]]\s*$/gm, '').trim();
            if (cleaned && cleaned.length > 1) {
              contentParts.push(cleaned);
            }
          }
        }

        // Join with bullet points for multiple notes
        cleanNotes = contentParts.length > 1
          ? contentParts.map(n => `• ${n}`).join('\n')
          : contentParts[0] || null;
      }

      return {
        id: job.id,
        serviceType: job.serviceType,
        date: job.startTime.toISOString(),
        amount: job.actualValue || job.estimatedValue || 0,
        status: job.status,
        workerName: workerNames[0] || 'N/A',
        notes: cleanNotes,
      };
    });

    return NextResponse.json({ jobs: transformedJobs });
  } catch (error) {
    console.error('Error fetching customer jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer jobs' },
      { status: 500 }
    );
  }
}
