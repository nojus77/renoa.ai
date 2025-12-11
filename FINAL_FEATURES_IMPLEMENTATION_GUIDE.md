# Final Features Implementation Guide

## ✅ COMPLETED

### Database & Dependencies
- ✅ Added `review_helpfulness` table with unique constraint
- ✅ Added `helpful_count` field to reviews table
- ✅ Schema pushed to database successfully
- ✅ Installed: `yet-another-react-lightbox`, `react-compare-slider`, `canvas-confetti`
- ✅ Created photo gallery API: `/app/api/customer/jobs/[id]/photos/route.ts`

---

## 🔨 REMAINING IMPLEMENTATIONS

### 1. Provider Photos in Job Detail Page

**File**: `/app/customer-portal/jobs/[id]/page.tsx`

Add after job details section:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from 'react-compare-slider';

// Add to component state
const [photos, setPhotos] = useState<any>({ all: [], before: [], after: [], inProgress: [] });
const [lightboxOpen, setLightboxOpen] = useState(false);
const [lightboxIndex, setLightboxIndex] = useState(0);
const [lightboxPhotos, setLightboxPhotos] = useState<any[]>([]);

// Fetch photos
useEffect(() => {
  if (job?.status === 'completed') {
    fetch(`/api/customer/jobs/${jobId}/photos`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setPhotos(data);
      });
  }
}, [jobId, job?.status]);

// Add to JSX
{job?.status === 'completed' && photos.all.length > 0 && (
  <Card className="mt-6">
    <CardHeader>
      <CardTitle>Project Photos</CardTitle>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({photos.all.length})</TabsTrigger>
          <TabsTrigger value="before">Before ({photos.before.length})</TabsTrigger>
          <TabsTrigger value="after">After ({photos.after.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.all.map((photo: any, idx: number) => (
              <div key={photo.id} className="relative group cursor-pointer">
                <img
                  src={photo.url}
                  alt={`Photo ${idx + 1}`}
                  className="rounded-lg w-full h-48 object-cover hover:opacity-90 transition"
                  onClick={() => {
                    setLightboxPhotos(photos.all.map((p: any) => ({ src: p.url })));
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                />
                <Badge className="absolute top-2 right-2" variant="secondary">
                  {photo.type}
                </Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="before" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.before.map((photo: any, idx: number) => (
              <img
                key={photo.id}
                src={photo.url}
                alt="Before"
                className="rounded-lg w-full h-48 object-cover cursor-pointer"
                onClick={() => {
                  setLightboxPhotos(photos.before.map((p: any) => ({ src: p.url })));
                  setLightboxIndex(idx);
                  setLightboxOpen(true);
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="after" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.after.map((photo: any, idx: number) => (
              <img
                key={photo.id}
                src={photo.url}
                alt="After"
                className="rounded-lg w-full h-48 object-cover cursor-pointer"
                onClick={() => {
                  setLightboxPhotos(photos.after.map((p: any) => ({ src: p.url })));
                  setLightboxIndex(idx);
                  setLightboxOpen(true);
                }}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {photos.before.length > 0 && photos.after.length > 0 && (
        <div className="mt-6">
          <p className="font-semibold mb-3">Before & After Comparison</p>
          <ReactCompareSlider
            itemOne={
              <ReactCompareSliderImage
                src={photos.before[0].url}
                alt="Before"
              />
            }
            itemTwo={
              <ReactCompareSliderImage
                src={photos.after[0].url}
                alt="After"
              />
            }
            className="rounded-lg h-64"
          />
        </div>
      )}

      <Button variant="outline" className="w-full mt-4">
        <Download className="h-4 w-4 mr-2" />
        Download All Photos
      </Button>
    </CardContent>
  </Card>
)}

<Lightbox
  open={lightboxOpen}
  close={() => setLightboxOpen(false)}
  index={lightboxIndex}
  slides={lightboxPhotos}
/>
```

---

### 2. Provider Reviews on Job Detail Page

**API Routes Needed**:

#### `/app/api/customer/providers/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id;

    // Get provider details
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        reviews: {
          where: { is_public: true },
          orderBy: { created_at: 'desc' },
        },
        jobs: {
          where: { status: 'completed' },
          select: { id: true },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    provider.reviews.forEach((review) => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    // Calculate average rating
    const totalRatings = provider.reviews.length;
    const averageRating =
      totalRatings > 0
        ? provider.reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

    return NextResponse.json({
      id: provider.id,
      businessName: provider.businessName,
      ownerName: provider.ownerName,
      email: provider.email,
      phone: provider.phone,
      serviceTypes: provider.serviceTypes,
      yearsInBusiness: provider.yearsInBusiness,
      averageRating: Number(averageRating.toFixed(1)),
      reviewCount: totalRatings,
      completedJobs: provider.jobs.length,
      ratingDistribution,
    });
  } catch (error: any) {
    console.error('Error fetching provider:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/customer/providers/[id]/reviews/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const stars = searchParams.get('stars'); // 'all', '5', '4', etc.
    const sort = searchParams.get('sort') || 'recent'; // 'recent', 'highest', 'helpful'
    const limit = 10;
    const skip = (page - 1) * limit;

    const where: any = {
      provider_id: providerId,
      is_public: true,
    };

    if (stars && stars !== 'all') {
      where.rating = parseInt(stars);
    }

    const orderBy: any = {};
    switch (sort) {
      case 'highest':
        orderBy.rating = 'desc';
        break;
      case 'helpful':
        orderBy.helpful_count = 'desc';
        break;
      default:
        orderBy.created_at = 'desc';
    }

    const [reviews, total] = await Promise.all([
      prisma.reviews.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          customers: {
            select: {
              name: true,
            },
          },
          jobs: {
            select: {
              serviceType: true,
            },
          },
        },
      }),
      prisma.reviews.count({ where }),
    ]);

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        ...review,
        customerFirstName: review.customers.name.split(' ')[0],
        serviceType: review.jobs.serviceType,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/customer/reviews/[id]/helpful/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCustomerSession } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCustomerSession();

    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviewId = params.id;
    const { helpful } = await request.json();

    // Check if already voted
    const existing = await prisma.review_helpfulness.findUnique({
      where: {
        review_id_customer_id: {
          review_id: reviewId,
          customer_id: session.customerId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already voted on this review' },
        { status: 400 }
      );
    }

    // Create vote
    await prisma.review_helpfulness.create({
      data: {
        review_id: reviewId,
        customer_id: session.customerId,
        helpful,
      },
    });

    // Update helpful_count if vote was positive
    if (helpful) {
      await prisma.reviews.update({
        where: { id: reviewId },
        data: {
          helpful_count: { increment: 1 },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error voting on review:', error);
    return NextResponse.json(
      { error: 'Failed to vote', details: error.message },
      { status: 500 }
    );
  }
}
```

**Add to Job Detail Page** (`/app/customer-portal/jobs/[id]/page.tsx`):

```tsx
// Add state
const [providerDetails, setProviderDetails] = useState<any>(null);
const [reviews, setReviews] = useState<any[]>([]);

// Fetch provider details and reviews
useEffect(() => {
  if (job?.providerId) {
    Promise.all([
      fetch(`/api/customer/providers/${job.providerId}`).then((r) => r.json()),
      fetch(`/api/customer/providers/${job.providerId}/reviews?page=1&sort=recent`)
        .then((r) => r.json()),
    ]).then(([providerData, reviewsData]) => {
      if (!providerData.error) setProviderDetails(providerData);
      if (!reviewsData.error) setReviews(reviewsData.reviews.slice(0, 3));
    });
  }
}, [job?.providerId]);

// Add to JSX
{providerDetails && (
  <Card className="mt-6">
    <CardHeader>
      <CardTitle>About Your Provider</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Provider Info */}
      <div className="flex items-center gap-4 pb-6 border-b">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-emerald-100 text-emerald-700">
            {providerDetails.businessName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="font-semibold text-lg">{providerDetails.businessName}</h3>
          <p className="text-sm text-gray-600">{providerDetails.ownerName}</p>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={cn(
                    i < Math.floor(providerDetails.averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium">
              {providerDetails.averageRating}
            </span>
            <span className="text-sm text-gray-500">
              ({providerDetails.reviewCount} reviews)
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-1">
            {providerDetails.completedJobs} jobs completed
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href={`/customer-portal/providers/${providerDetails.id}`}>
            View Profile
          </Link>
        </Button>
      </div>

      {/* Rating Distribution */}
      <div className="py-6 border-b">
        <h4 className="font-semibold text-sm mb-3">Rating Distribution</h4>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = providerDetails.ratingDistribution[stars] || 0;
            const percentage = (count / providerDetails.reviewCount) * 100 || 0;
            return (
              <div key={stars} className="flex items-center gap-3">
                <span className="text-sm w-12">{stars} ⭐</span>
                <Progress value={percentage} className="flex-1 h-2" />
                <span className="text-sm text-gray-600 w-12 text-right">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="pt-6">
        <h4 className="font-semibold mb-4">Recent Reviews</h4>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="pb-4 border-b last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{review.customerFirstName}</p>
                    <Badge variant="outline" className="text-xs">
                      ✓ Verified
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={cn(
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(review.created_at))} ago
                    </span>
                  </div>
                </div>
              </div>

              <Badge variant="secondary" className="text-xs mb-2">
                {review.serviceType}
              </Badge>

              <p className="text-sm text-gray-700 line-clamp-3">
                {review.comment}
              </p>

              {review.helpful_count > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {review.helpful_count} people found this helpful
                </p>
              )}
            </div>
          ))}
        </div>

        <Button variant="outline" asChild className="w-full mt-4">
          <Link href={`/customer-portal/providers/${providerDetails.id}#reviews`}>
            View All {providerDetails.reviewCount} Reviews
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

---

### 3. Booking Success Modal with Calendar Export

**Create**: `/components/customer/BookingSuccessModal.tsx`

```tsx
'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Calendar } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface Booking {
  id: string;
  service: string;
  provider: string;
  datetime: string;
  address: string;
  total: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  customerEmail: string;
}

export default function BookingSuccessModal({
  open,
  onOpenChange,
  booking,
  customerEmail,
}: Props) {
  useEffect(() => {
    if (open) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [open]);

  const handleAddToCalendar = () => {
    const icsContent = generateICS(booking);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `renoa-booking-${booking.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-4 py-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600 text-sm">
              Your service has been scheduled successfully
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">{booking.service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Provider:</span>
              <span className="font-medium">{booking.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-medium">{booking.datetime}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold text-emerald-600 text-lg">
                ${booking.total}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ Confirmation sent to {customerEmail}</p>
            <p>✓ Provider will contact you 24 hours before</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleAddToCalendar}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
            <Button asChild className="flex-1">
              <Link href={`/customer-portal/jobs/${booking.id}`}>
                View Details
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function generateICS(booking: Booking): string {
  const startDate = new Date(booking.datetime);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours

  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Renoa//Customer Portal//EN
BEGIN:VEVENT
UID:${booking.id}@renoa.ai
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${booking.service} - Renoa
DESCRIPTION:Service with ${booking.provider}\\nTotal: $${booking.total}
LOCATION:${booking.address}
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${booking.service} tomorrow
END:VALARM
END:VEVENT
END:VCALENDAR`;
}
```

---

## 📋 Implementation Checklist

- [x] Database schema updated
- [x] Dependencies installed
- [x] Photo gallery API created
- [ ] Add photos to job detail page
- [ ] Create provider API routes (3 routes)
- [ ] Add reviews to job detail page
- [ ] Create BookingSuccessModal component
- [ ] Enhance BookAgainModal (add quick rebook section)
- [ ] Create provider profile page (optional)

---

## 🚀 Quick Start

1. **Copy code from this guide** into respective files
2. **Add missing imports** at top of each file
3. **Test each feature** incrementally
4. **Adjust styling** as needed for your design system

---

## 📚 Additional Resources

- Lightbox docs: https://yet-another-react-lightbox.com/
- Compare slider: https://github.com/nerdyman/react-compare-slider
- Canvas confetti: https://github.com/catdad/canvas-confetti

---

**Last Updated**: November 12, 2024
**Status**: Core retention features complete, UI enhancements ready for implementation
