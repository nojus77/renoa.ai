import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { del } from '@vercel/blob';

const prisma = new PrismaClient();

// GET - Fetch single customer with full details
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.customerId },
      include: {
        jobs: {
          include: {
            photos: true,
          },
          orderBy: {
            startTime: 'desc',
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Calculate stats
    const jobCount = customer.jobs.length;
    const totalSpent = customer.jobs.reduce((sum, job) => {
      return sum + (job.actualValue || job.estimatedValue || 0);
    }, 0);
    const averageJobValue = jobCount > 0 ? totalSpent / jobCount : 0;
    const lastJob = customer.jobs[0];
    const completedJobs = customer.jobs.filter(j => j.status === 'completed').length;

    // Calculate days since last job
    let daysSinceLastJob = null;
    if (lastJob) {
      const now = new Date();
      const lastJobDate = new Date(lastJob.startTime);
      daysSinceLastJob = Math.floor((now.getTime() - lastJobDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      success: true,
      customer: {
        ...customer,
        stats: {
          totalJobs: jobCount,
          completedJobs,
          totalSpent,
          averageJobValue,
          daysSinceLastJob,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      tags,
      notes,
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (tags !== undefined) updateData.tags = tags;
    if (notes !== undefined) updateData.notes = notes;

    const customer = await prisma.customer.update({
      where: { id: params.customerId },
      data: updateData,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// PATCH - Update customer (alias for PUT)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      tags,
      notes,
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (tags !== undefined) updateData.tags = tags;
    if (notes !== undefined) updateData.notes = notes;

    const customer = await prisma.customer.update({
      where: { id: params.customerId },
      data: updateData,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE - Delete customer with comprehensive safety checks
export async function DELETE(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Fetch customer with all related data
    const customer = await prisma.customer.findUnique({
      where: { id: params.customerId },
      include: {
        jobs: {
          include: {
            photos: true,
          },
        },
        invoices: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // SAFETY CHECK 1: Check for active jobs (scheduled or in_progress)
    const activeJobs = customer.jobs.filter(job =>
      job.status === 'scheduled' || job.status === 'in_progress'
    );

    if (activeJobs.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete customer with active jobs',
        reason: `Customer has ${activeJobs.length} active job(s) (scheduled or in progress). Please complete or cancel these jobs first.`,
        activeJobCount: activeJobs.length,
      }, { status: 400 });
    }

    // SAFETY CHECK 2: Check for unpaid invoices
    const unpaidInvoices = customer.invoices.filter(invoice =>
      invoice.status !== 'paid' && invoice.status !== 'cancelled'
    );

    if (unpaidInvoices.length > 0) {
      const unpaidTotal = unpaidInvoices.reduce((sum, inv) =>
        sum + Number(inv.total) - Number(inv.amountPaid), 0
      );

      return NextResponse.json({
        error: 'Cannot delete customer with unpaid invoices',
        reason: `Customer has ${unpaidInvoices.length} unpaid invoice(s) totaling $${unpaidTotal.toFixed(2)}. Please collect payment or cancel these invoices first.`,
        unpaidInvoiceCount: unpaidInvoices.length,
        unpaidAmount: unpaidTotal,
      }, { status: 400 });
    }

    // If we reach here, customer is safe to delete
    console.log(`🗑️ Deleting customer ${params.customerId} and all related data...`);

    // Step 1: Delete all job photos from Vercel Blob
    const allPhotos = customer.jobs.flatMap(job => job.photos);

    if (allPhotos.length > 0) {
      console.log(`📸 Deleting ${allPhotos.length} job photos from Vercel Blob...`);

      for (const photo of allPhotos) {
        try {
          await del(photo.url);
          console.log(`✅ Deleted photo: ${photo.id}`);
        } catch (blobError) {
          console.error(`⚠️ Failed to delete photo from blob: ${photo.id}`, blobError);
          // Continue even if blob deletion fails - database cleanup is more important
        }
      }
    }

    // Step 2: Delete all JobPhotos records (cascade will handle this, but being explicit)
    if (allPhotos.length > 0) {
      await prisma.jobPhoto.deleteMany({
        where: {
          jobId: {
            in: customer.jobs.map(job => job.id),
          },
        },
      });
      console.log(`✅ Deleted ${allPhotos.length} JobPhoto records`);
    }

    // Step 3: Delete all invoice line items (cascade will handle, but being explicit)
    if (customer.invoices.length > 0) {
      await prisma.invoiceLineItem.deleteMany({
        where: {
          invoiceId: {
            in: customer.invoices.map(inv => inv.id),
          },
        },
      });
      console.log(`✅ Deleted invoice line items`);
    }

    // Step 4: Delete all payments (cascade will handle, but being explicit)
    if (customer.invoices.length > 0) {
      await prisma.payment.deleteMany({
        where: {
          invoiceId: {
            in: customer.invoices.map(inv => inv.id),
          },
        },
      });
      console.log(`✅ Deleted payments`);
    }

    // Step 5: Delete all invoices
    if (customer.invoices.length > 0) {
      await prisma.invoice.deleteMany({
        where: { customerId: params.customerId },
      });
      console.log(`✅ Deleted ${customer.invoices.length} invoices`);
    }

    // Step 6: Delete all jobs
    if (customer.jobs.length > 0) {
      await prisma.job.deleteMany({
        where: { customerId: params.customerId },
      });
      console.log(`✅ Deleted ${customer.jobs.length} jobs`);
    }

    // Step 7: Delete loyalty points
    await prisma.loyalty_points.deleteMany({
      where: { customer_id: params.customerId },
    });
    console.log(`✅ Deleted loyalty points`);

    // Step 8: Delete loyalty transactions
    await prisma.loyalty_transactions.deleteMany({
      where: { customer_id: params.customerId },
    });
    console.log(`✅ Deleted loyalty transactions`);

    // Step 9: Delete customer notifications
    await prisma.customer_notifications.deleteMany({
      where: { customer_id: params.customerId },
    });
    console.log(`✅ Deleted customer notifications`);

    // Step 10: Delete messages
    await prisma.provider_customer_messages.deleteMany({
      where: { customer_id: params.customerId },
    });
    console.log(`✅ Deleted messages`);

    // Step 11: Finally delete the customer
    await prisma.customer.delete({
      where: { id: params.customerId },
    });

    console.log(`✅ Successfully deleted customer ${params.customerId}`);

    return NextResponse.json({
      success: true,
      message: 'Customer and all related data deleted successfully',
      deleted: {
        jobs: customer.jobs.length,
        invoices: customer.invoices.length,
        photos: allPhotos.length,
      },
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
