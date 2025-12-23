"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  X,
  MapPin,
  Phone,
  Calendar,
  Clock,
  User,
  DollarSign,
  Briefcase,
  FileText,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface JobPreviewData {
  id: string;
  customerName: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime?: string;
  status?: string;
  estimatedValue?: number | null;
  actualValue?: number | null;
  workerName?: string | null;
  phone?: string;
  notes?: string;
}

interface JobPreviewModalProps {
  job: JobPreviewData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobPreviewModal({ job, isOpen, onClose }: JobPreviewModalProps) {
  const router = useRouter();
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job && isOpen) {
      fetchJobDetails();
    }
  }, [job, isOpen]);

  const fetchJobDetails = async () => {
    if (!job) return;

    setLoading(true);
    try {
      const providerId = localStorage.getItem('providerId');
      const res = await fetch(`/api/provider/jobs/${job.id}?providerId=${providerId}`);
      if (res.ok) {
        const data = await res.json();
        setJobDetails(data.job || data);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "EEE, MMM d 'at' h:mm a");
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'h:mm a');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'in_progress': return 'bg-orange-500/20 text-orange-400';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const displayJob = jobDetails || job;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-in Panel from Left */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-full sm:w-[420px] bg-card border-r border-border z-50 transition-transform duration-300 ease-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Job Preview</h2>
                <p className="text-xs text-muted-foreground">Quick view</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Customer & Service */}
              <div className="bg-muted/30 rounded-xl p-4 border border-border">
                <h3 className="text-xl font-bold text-foreground mb-1">
                  {displayJob.customerName || displayJob.customer?.name || 'Unknown Customer'}
                </h3>
                <div className="flex items-center gap-2 text-primary">
                  <Briefcase className="h-4 w-4" />
                  <span className="font-medium">{displayJob.serviceType}</span>
                </div>

                {displayJob.status && (
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(displayJob.status)}`}>
                      {displayJob.status.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(displayJob.startTime)}
                    </p>
                    {displayJob.endTime && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Until {formatTime(displayJob.endTime)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              {displayJob.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayJob.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-muted/30 rounded-xl p-4 border border-border hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 group-hover:text-primary transition-colors" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {displayJob.address}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              )}

              {/* Worker */}
              {(displayJob.workerName || displayJob.assignedUsers?.length > 0) && (
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned Worker</p>
                      <p className="text-sm font-medium text-foreground">
                        {displayJob.workerName ||
                         displayJob.assignedUsers?.map((u: any) => `${u.firstName} ${u.lastName}`).join(', ') ||
                         'Not assigned'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount */}
              {(displayJob.estimatedValue || displayJob.actualValue) && (
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {displayJob.actualValue ? 'Amount' : 'Estimated'}
                      </p>
                      <p className="text-lg font-bold text-emerald-500">
                        {formatCurrency(displayJob.actualValue || displayJob.estimatedValue)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Phone */}
              {(displayJob.phone || displayJob.customer?.phone) && (
                <a
                  href={`tel:${displayJob.phone || displayJob.customer?.phone}`}
                  className="block bg-muted/30 rounded-xl p-4 border border-border hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5 group-hover:text-primary transition-colors" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {displayJob.phone || displayJob.customer?.phone}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              )}

              {/* Notes */}
              {(displayJob.notes || displayJob.jobInstructions) && (
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm text-foreground mt-1">
                        {displayJob.notes || displayJob.jobInstructions}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4">
          <button
            onClick={() => {
              router.push(`/provider/jobs/${job.id}`);
              onClose();
            }}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            View Full Details
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
