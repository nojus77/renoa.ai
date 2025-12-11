'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, Phone, Mail, Loader2, AlertCircle, Star, RefreshCw, Download, Image as ImageIcon } from 'lucide-react';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import ReviewModal from '@/components/customer/ReviewModal';
import BookAgainModal from '@/components/customer/BookAgainModal';
import JobRecommendations from '@/components/customer/JobRecommendations';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

interface Job {
  id: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  estimatedValue: number | null;
  actualValue: number | null;
  customerNotes: string | null;
  hasReview: boolean;
  provider: {
    businessName: string;
    phone: string;
    email: string;
  };
  photos?: Array<{
    id: string;
    type: string;
    url: string;
    createdAt: string;
  }>;
}

export default function CustomerJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showBookAgainModal, setShowBookAgainModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/jobs/${jobId}`);

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/customer-portal/login');
          return;
        }
        throw new Error('Failed to fetch job details');
      }

      const data = await response.json();
      setJob(data.job);
    } catch (error: any) {
      console.error('Error fetching job:', error);
      toast.error(error.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const openLightbox = (photos: string[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const downloadAllPhotos = async () => {
    if (!job?.photos || job.photos.length === 0) return;

    toast.info('Downloading photos...');
    for (let i = 0; i < job.photos.length; i++) {
      const photo = job.photos[i];
      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `job-${jobId}-${photo.type}-${i + 1}.jpg`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading photo:', error);
      }
    }
    toast.success('All photos downloaded!');
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </CustomerLayout>
    );
  }

  if (!job) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">Job not found</h2>
          <p className="text-zinc-600 mb-4">This job doesn&apos;t exist or you don&apos;t have access to it</p>
          <Button onClick={() => router.push('/customer-portal/jobs')}>
            Back to Jobs
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  const beforePhotos = job.photos?.filter(p => p.type === 'before') || [];
  const duringPhotos = job.photos?.filter(p => p.type === 'during') || [];
  const afterPhotos = job.photos?.filter(p => p.type === 'after') || [];

  return (
    <CustomerLayout>
      {/* Back Button */}
      <button
        onClick={() => router.push('/customer-portal/jobs')}
        className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Jobs</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">{job.serviceType}</h1>
            <p className="text-zinc-600">{job.provider.businessName}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(job.status)}`}>
            {getStatusLabel(job.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-3 text-zinc-700">
            <Calendar className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500 uppercase font-medium">Date</p>
              <p className="font-semibold">{formatDate(job.startTime)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-zinc-700">
            <Clock className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500 uppercase font-medium">Time</p>
              <p className="font-semibold">{formatTime(job.startTime)} - {formatTime(job.endTime)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-zinc-700">
            <MapPin className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500 uppercase font-medium">Location</p>
              <p className="font-semibold">{job.address}</p>
            </div>
          </div>

          {(job.estimatedValue || job.actualValue) && (
            <div className="flex items-center gap-3 text-zinc-700">
              <DollarSign className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500 uppercase font-medium">
                  {job.actualValue ? 'Final Amount' : 'Estimated Cost'}
                </p>
                <p className="font-bold text-emerald-600 text-lg">
                  ${(job.actualValue || job.estimatedValue)!.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes */}
          {job.customerNotes && (
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-lg font-bold text-zinc-900 mb-3">Service Notes</h2>
              <p className="text-zinc-700 whitespace-pre-wrap">{job.customerNotes}</p>
            </div>
          )}

          {/* Photos with Enhanced Gallery */}
          {(beforePhotos.length > 0 || duringPhotos.length > 0 || afterPhotos.length > 0) && (
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Job Photos ({job.photos?.length || 0})
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAllPhotos}
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="all">All ({job.photos?.length || 0})</TabsTrigger>
                  <TabsTrigger value="before">Before ({beforePhotos.length})</TabsTrigger>
                  <TabsTrigger value="after">After ({afterPhotos.length})</TabsTrigger>
                  <TabsTrigger value="compare">Compare</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {job.photos?.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="relative cursor-pointer group"
                        onClick={() => openLightbox(job.photos?.map(p => p.url) || [], index)}
                      >
                        <img
                          src={photo.url}
                          alt={photo.type}
                          className="w-full aspect-square object-cover rounded-lg border border-zinc-200 group-hover:border-emerald-500 transition-all"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                          {photo.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="before" className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {beforePhotos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="relative cursor-pointer group"
                        onClick={() => openLightbox(beforePhotos.map(p => p.url), index)}
                      >
                        <img
                          src={photo.url}
                          alt="Before"
                          className="w-full aspect-square object-cover rounded-lg border border-zinc-200 group-hover:border-emerald-500 transition-all"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {beforePhotos.length === 0 && (
                    <p className="text-center text-zinc-500 py-8">No before photos available</p>
                  )}
                </TabsContent>

                <TabsContent value="after" className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {afterPhotos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="relative cursor-pointer group"
                        onClick={() => openLightbox(afterPhotos.map(p => p.url), index)}
                      >
                        <img
                          src={photo.url}
                          alt="After"
                          className="w-full aspect-square object-cover rounded-lg border border-zinc-200 group-hover:border-emerald-500 transition-all"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {afterPhotos.length === 0 && (
                    <p className="text-center text-zinc-500 py-8">No after photos available</p>
                  )}
                </TabsContent>

                <TabsContent value="compare">
                  {beforePhotos.length > 0 && afterPhotos.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-zinc-600">Drag the slider to compare before and after</p>
                      <div className="rounded-lg overflow-hidden border-2 border-zinc-200">
                        <ReactCompareSlider
                          itemOne={
                            <ReactCompareSliderImage
                              src={beforePhotos[0].url}
                              alt="Before"
                            />
                          }
                          itemTwo={
                            <ReactCompareSliderImage
                              src={afterPhotos[0].url}
                              alt="After"
                            />
                          }
                          style={{ height: '400px' }}
                        />
                      </div>
                      <div className="flex justify-between text-sm font-medium text-zinc-700">
                        <span>← Before</span>
                        <span>After →</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-zinc-500 mb-2">Comparison not available</p>
                      <p className="text-sm text-zinc-400">
                        Need both before and after photos to compare
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Service Recommendations */}
          {job.status === 'completed' && (
            <JobRecommendations serviceType={job.serviceType} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Provider Contact */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Contact Provider</h2>
            <div className="space-y-3">
              <a
                href={`tel:${job.provider.phone}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <Phone className="h-5 w-5" />
                <div>
                  <p className="text-xs font-medium">Call</p>
                  <p className="text-sm font-semibold">{job.provider.phone}</p>
                </div>
              </a>

              <a
                href={`mailto:${job.provider.email}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Mail className="h-5 w-5" />
                <div>
                  <p className="text-xs font-medium">Email</p>
                  <p className="text-sm font-semibold">{job.provider.email}</p>
                </div>
              </a>

              <Button
                onClick={() => router.push('/customer-portal/messages')}
                variant="outline"
                className="w-full border-zinc-300"
              >
                Send Message
              </Button>
            </div>
          </div>

          {/* Actions */}
          {job.status === 'completed' && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
              <h2 className="text-lg font-bold text-zinc-900 mb-3">Job Completed!</h2>
              <p className="text-sm text-zinc-600 mb-4">Thank you for choosing our service</p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/customer-portal/invoices')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500"
                >
                  View Invoice
                </Button>
                {!job.hasReview && (
                  <Button
                    onClick={() => setShowReviewModal(true)}
                    variant="outline"
                    className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Leave a Review
                  </Button>
                )}
                {job.hasReview && (
                  <div className="flex items-center gap-2 justify-center p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Star className="h-4 w-4 fill-emerald-600" />
                    <span className="text-sm font-medium">Review Submitted</span>
                  </div>
                )}
                {/* Book Again Button */}
                <Button
                  onClick={() => setShowBookAgainModal(true)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Book This Service Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && job && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={() => {
            fetchJobDetails(); // Refresh to show review was submitted
          }}
          jobId={job.id}
          providerName={job.provider.businessName}
          serviceType={job.serviceType}
        />
      )}

      {/* Book Again Modal */}
      {showBookAgainModal && job && (
        <BookAgainModal
          isOpen={showBookAgainModal}
          onClose={() => setShowBookAgainModal(false)}
          onSuccess={() => {
            setShowBookAgainModal(false);
            toast.success('Service booked successfully!');
            router.push('/customer-portal/jobs');
          }}
          serviceType={job.serviceType}
          providerId={job.provider.businessName}
          providerName={job.provider.businessName}
          address={job.address}
          estimatedValue={job.actualValue || job.estimatedValue || 150}
          bookingSource="rebook_job_detail"
        />
      )}

      {/* Photo Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxPhotos.map((url) => ({ src: url }))}
      />
    </CustomerLayout>
  );
}
