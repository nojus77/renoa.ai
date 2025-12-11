'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { formatInProviderTz } from '@/lib/utils/timezone';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Phone,
  Navigation,
  MessageSquare,
  Camera,
  MoreHorizontal,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import WorkerSuggestionSelector from './WorkerSuggestionSelector';

interface Job {
  id: string;
  customerName: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  isRenoaLead: boolean;
  phone: string;
  email: string;
  address: string;
  estimatedValue?: number;
  actualValue?: number;
  createdAt: string;
  notes?: string;
  customerNotes?: string;
  assignedUserIds: string[];
}

interface JobDetailsDrawerProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (jobId: string) => void;
}

export function JobDetailsDrawer({ job, isOpen, onClose, onDelete }: JobDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAssignModal, setShowAssignModal] = useState(false);

  if (!job) return null;

  const handleCall = () => {
    if (job.phone) {
      window.open(`tel:${job.phone}`, '_self');
    }
  };

  const handleNavigate = () => {
    if (job.address) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(job.address)}`, '_blank');
    }
  };

  const handleMessage = () => {
    if (job.phone) {
      window.open(`sms:${job.phone}`, '_self');
    }
  };

  const handleDelete = () => {
    if (confirm(`Delete job for ${job.customerName}?`)) {
      onDelete(job.id);
      onClose();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/provider/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          providerId: localStorage.getItem('providerId'),
          userId: localStorage.getItem('userId'),
        }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success('Status updated');
      // Refresh the page data
      window.location.reload();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAssignWorker = async (workerId: string) => {
    try {
      const providerId = localStorage.getItem('providerId');
      const userId = localStorage.getItem('userId');

      const res = await fetch(`/api/provider/jobs/${job.id}/assign-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          userId,
          userIds: [workerId],
          mode: 'replace',
        }),
      });

      if (!res.ok) throw new Error('Failed to assign worker');

      toast.success('Worker assigned successfully');
      // Refresh the page to show updated assignment
      window.location.reload();
    } catch (error) {
      console.error('Error assigning worker:', error);
      toast.error('Failed to assign worker');
      throw error;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[500px] p-0 bg-zinc-900 border-zinc-800 flex flex-col"
      >
        {/* STICKY HEADER SECTION */}
        <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800">
          {/* Header with name/value */}
          <div className="p-6 pb-4">
            <div className="flex items-baseline justify-between mb-3">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-zinc-100 leading-none">
                  {job.customerName}
                </h2>
                <p className="text-zinc-400 mt-2">{job.serviceType}</p>
              </div>

              {/* Value aligned with name baseline */}
              <div className="text-right">
                <div className="text-3xl font-bold text-zinc-100 leading-none">
                  ${job.estimatedValue?.toLocaleString() || '0'}
                </div>
                <div className="text-[10px] text-zinc-600 mt-1">Estimated value</div>
              </div>
            </div>

            {/* Date/time/address line */}
            <div className="text-sm text-zinc-400 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(job.startTime), 'EEE, MMM d')}</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatInProviderTz(job.startTime, 'h:mm a', 'America/Chicago')}</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{job.address}</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS - Reordered, lighter borders */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800"
                onClick={handleCall}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800"
                onClick={handleMessage}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800"
                onClick={handleNavigate}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Navigate
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800"
              >
                <Camera className="w-4 h-4 mr-2" />
                Photos
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex items-center border-t border-zinc-800">
            {['overview', 'photos', 'notes', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-6 py-3 text-sm font-medium capitalize transition-colors',
                  activeTab === tab
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-zinc-400 hover:text-zinc-300'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* CLICKABLE PROGRESS BAR */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-3">Job Status</h3>
                <div className="flex items-center gap-2">
                  {[
                    { key: 'scheduled', label: 'Scheduled' },
                    { key: 'in_progress', label: 'In Progress' },
                    { key: 'completed', label: 'Completed' },
                    { key: 'paid', label: 'Paid' },
                  ].map((step, index) => {
                    const isActive = getStepIndex(job.status) >= index;
                    const isCurrent = job.status === step.key;

                    return (
                      <button
                        key={step.key}
                        onClick={() => handleStatusChange(step.key)}
                        className="flex-1 group"
                      >
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all',
                            isCurrent &&
                              'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-900',
                            isActive
                              ? 'bg-emerald-500'
                              : 'bg-zinc-700 group-hover:bg-zinc-600'
                          )}
                        />
                        <div
                          className={cn(
                            'text-xs text-center mt-2 transition-colors',
                            isCurrent ? 'text-emerald-400 font-medium' : 'text-zinc-500'
                          )}
                        >
                          {step.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-zinc-600 mt-3 text-center">
                  Click any step to update job status
                </p>
              </div>

              {/* INFO GRID (2 columns) */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-3">Job Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Customer" value={job.customerName} />
                  <InfoField label="Phone" value={job.phone} />
                  <InfoField label="Email" value={job.email} />
                  <InfoField label="Service" value={job.serviceType} />
                  <InfoField
                    label="Duration"
                    value={`${getDuration(job.startTime, job.endTime)}h`}
                  />

                  {/* CREW ASSIGNMENT - Special treatment */}
                  <div className="col-span-2">
                    <div className="text-xs text-zinc-500 mb-2">Crew Assigned</div>
                    {job.assignedUserIds?.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-100">
                          {job.assignedUserIds.length} worker
                          {job.assignedUserIds.length !== 1 ? 's' : ''} assigned
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-zinc-400 hover:text-zinc-100"
                          onClick={() => setShowAssignModal(true)}
                        >
                          Reassign
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
                          Unassigned
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-zinc-700"
                          onClick={() => setShowAssignModal(true)}
                        >
                          + Assign Crew
                        </Button>
                      </div>
                    )}
                  </div>

                  {job.isRenoaLead && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Source</div>
                      <Badge
                        variant="outline"
                        className="text-xs border-emerald-500/30 text-emerald-400"
                      >
                        Renoa Lead
                      </Badge>
                    </div>
                  )}
                  <InfoField
                    label="Created"
                    value={format(new Date(job.createdAt), 'MMM d, yyyy')}
                  />
                </div>
              </div>

              {/* INTERNAL NOTES (if any) */}
              {job.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-2">Internal Notes</h3>
                  <p className="text-sm text-zinc-300 bg-zinc-800 rounded-lg p-3">{job.notes}</p>
                </div>
              )}

              {/* CUSTOMER NOTES (if any) */}
              {job.customerNotes && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-2">Customer Notes</h3>
                  <p className="text-sm text-zinc-300 bg-zinc-800 rounded-lg p-3">
                    {job.customerNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="text-center text-zinc-500 py-12">
              <Camera className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
              <p>No photos yet</p>
              <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-500">
                Upload Photos
              </Button>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <textarea
                className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Add notes about this job..."
                defaultValue={job.notes || ''}
              />
              <Button size="sm" className="mt-2 bg-emerald-600 hover:bg-emerald-500">
                Save Note
              </Button>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              <ActivityItem
                icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
                title="Job created"
                timestamp={new Date(job.createdAt)}
              />
              {job.status === 'in_progress' && (
                <ActivityItem
                  icon={<Circle className="w-4 h-4 text-yellow-500" />}
                  title="Job started"
                  timestamp={new Date(job.startTime)}
                />
              )}
              {job.status === 'completed' && (
                <ActivityItem
                  icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
                  title="Job completed"
                  timestamp={new Date(job.endTime)}
                />
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t border-zinc-800 p-6 bg-zinc-900">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Job
            </Button>
          </div>
        </div>
      </SheetContent>

      {/* Worker Assignment Modal */}
      {showAssignModal && (
        <WorkerSuggestionSelector
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          jobId={job.id}
          providerId={localStorage.getItem('providerId') || ''}
          onAssign={handleAssignWorker}
        />
      )}
    </Sheet>
  );
}

// Helper components
function InfoField({ label, value }: { label: string; value?: string | null }) {
  // Don't render if no value
  if (!value) return null;

  return (
    <div>
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-sm text-zinc-100">{value}</div>
    </div>
  );
}

function ActivityItem({
  icon,
  title,
  timestamp,
}: {
  icon: React.ReactNode;
  title: string;
  timestamp: Date;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">{icon}</div>
      <div className="flex-1">
        <div className="text-sm text-zinc-100">{title}</div>
        <div className="text-xs text-zinc-500">{format(timestamp, 'MMM d, h:mm a')}</div>
      </div>
    </div>
  );
}

function getStepIndex(status: string): number {
  const steps: Record<string, number> = {
    scheduled: 0,
    in_progress: 1,
    completed: 2,
    paid: 3,
  };
  return steps[status] || 0;
}

function getDuration(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  return hours.toFixed(1);
}
