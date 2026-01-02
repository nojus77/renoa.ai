'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import {
  MapPin, Navigation, Clock, ChevronRight, ChevronLeft, Route, Loader2, Calendar,
  CheckCircle, XCircle, Users, AlertTriangle, Lock, Unlock, GripVertical,
  ChevronDown, ChevronUp, Filter, RefreshCw, Zap, Building2
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, startOfDay, addDays } from 'date-fns';

// Worker colors for routes
const WORKER_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

interface Job {
  id: string;
  serviceType: string;
  status: string;
  startTime: string;
  endTime?: string;
  address: string;
  appointmentType: 'fixed' | 'anytime' | 'window';
  routeOrder?: number | null;
  estimatedArrival?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  customer: {
    id: string;
    name: string;
    phone?: string;
    address: string | null;
  };
  assignedUserIds: string[];
  assignedCrew?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  color: string;
  homeLatitude?: number | null;
  homeLongitude?: number | null;
}

interface OfficeLocation {
  name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface WorkerRoute {
  workerId: string;
  workerName: string;
  workerColor: string;
  jobs: Job[];
  directions?: google.maps.DirectionsResult | null;
  totalDistance: string;
  totalDuration: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Light map styles for provider view
const lightMapStyles = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

// Dark map styles
const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return '#10b981';
    case 'on_the_way':
      return '#3b82f6';
    case 'in_progress':
      return '#f59e0b';
    case 'completed':
      return '#6b7280';
    default:
      return '#10b981';
  }
};

const getAppointmentTypeIcon = (type: string) => {
  switch (type) {
    case 'fixed':
      return <Lock className="w-3 h-3 text-red-400" />;
    case 'window':
      return <Clock className="w-3 h-3 text-amber-400" />;
    default:
      return <Unlock className="w-3 h-3 text-emerald-400" />;
  }
};

const formatJobDate = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
};

export default function DispatchPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [unassignedJobs, setUnassignedJobs] = useState<Job[]>([]);
  const [workerRoutes, setWorkerRoutes] = useState<WorkerRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [showUnassigned, setShowUnassigned] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [center, setCenter] = useState({ lat: 41.8781, lng: -87.6298 });
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [providerId, setProviderId] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [providerName, setProviderName] = useState<string>('');
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<{
    workers: Array<{
      id: string;
      name: string;
      color: string;
      jobCount: number;
      totalMiles: number;
      totalMinutes: number;
      savedMiles: number;
    }>;
    unassignableJobs: Array<{
      id: string;
      service: string;
      customer: string | null;
      reason: string;
    }>;
    skillMismatches: Array<{
      jobId: string;
      jobTitle: string;
      serviceType: string;
      assignedWorkerId: string;
      assignedWorkerName: string;
      workerSkills: string[];
      workerSkillIds: string[];
      requiredSkills: string[];
      requiredSkillIds: string[];
      missingSkillIds: string[];
      missingSkillNames: string[];
    }>;
    needsReview: Array<{
      jobId: string;
      jobTitle: string;
      serviceType: string;
      reason: string;
      message: string;
      requiredWorkerCount?: number;
      requiredSkillIds?: string[];
      requiredSkillNames?: string[];
    }>;
    totalSavedMiles: number;
    totalSavedMinutes: number;
    summary: {
      totalWorkers: number;
      totalJobs: number;
      unassignedCount: number;
      skillMismatchCount: number;
      needsReviewCount: number;
      avgJobsPerWorker: number;
    };
  } | null>(null);
  const [showSkillMismatchModal, setShowSkillMismatchModal] = useState(false);
  const [showNeedsReviewModal, setShowNeedsReviewModal] = useState(false);
  const [overrideModalJob, setOverrideModalJob] = useState<{
    jobId: string;
    jobTitle: string;
    assignedWorkerId: string;
    assignedWorkerName: string;
    missingSkillNames: string[];
  } | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(['all']);
  const [nextJobDate, setNextJobDate] = useState<string | null>(null);
  const [prevJobDate, setPrevJobDate] = useState<string | null>(null);

  // Check theme
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    language: 'en',
    region: 'US',
  });

  // Load provider ID
  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');
    if (!id) {
      router.push('/provider/login');
      return;
    }
    setProviderId(id);
    setProviderName(name || 'Provider Portal');
  }, [router]);

  // Fetch dispatch data - supports silent background refresh
  const fetchDispatchData = useCallback(async (silent = false) => {
    if (!providerId) return;

    // Only show loading spinner on initial load, not background refreshes
    if (!silent) {
      setLoading(true);
    }

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`/api/provider/dispatch?providerId=${providerId}&date=${dateStr}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch dispatch data');
      }

      setJobs(data.jobs || []);
      setWorkers(data.workers || []);
      setUnassignedJobs(data.unassignedJobs || []);
      setOfficeLocation(data.office || null);
      setNextJobDate(data.nextJobDate || null);
      setPrevJobDate(data.prevJobDate || null);

      // Only center map on initial load, not on background refreshes
      // This preserves user's zoom/pan position during silent updates
      if (!initialLoadComplete) {
        const allJobs = [...(data.jobs || []), ...(data.unassignedJobs || [])];
        const firstWithCoords = allJobs.find((j: Job) => j.latitude && j.longitude);
        if (firstWithCoords) {
          setCenter({ lat: firstWithCoords.latitude!, lng: firstWithCoords.longitude! });
        } else if (data.office?.latitude && data.office?.longitude) {
          setCenter({ lat: data.office.latitude, lng: data.office.longitude });
        }
        setInitialLoadComplete(true);
      }
    } catch (error) {
      console.error('Failed to fetch dispatch data:', error);
      // Only show error notification on non-silent fetches
      if (!silent) {
        setNotification({ message: 'Failed to load dispatch data', type: 'error' });
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [providerId, selectedDate, initialLoadComplete]);

  useEffect(() => {
    fetchDispatchData();
  }, [fetchDispatchData]);

  // Auto-refresh every 30 seconds - silent background updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!optimizing) {
        fetchDispatchData(true); // Silent refresh - no loading state, preserves map position
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDispatchData, optimizing]);

  // Filter toggle helper
  const toggleStatusFilter = (status: string) => {
    if (status === 'all') {
      setStatusFilter(['all']);
    } else {
      setStatusFilter(prev => {
        const withoutAll = prev.filter(s => s !== 'all');
        if (withoutAll.includes(status)) {
          const newFilter = withoutAll.filter(s => s !== status);
          return newFilter.length === 0 ? ['all'] : newFilter;
        } else {
          return [...withoutAll, status];
        }
      });
    }
  };

  // Filter jobs based on status filter
  const filterJobsByStatus = (jobList: Job[]) => {
    if (statusFilter.includes('all')) return jobList;
    return jobList.filter(job => statusFilter.includes(job.status));
  };

  // Group jobs by worker and calculate routes
  useEffect(() => {
    if (!isLoaded || jobs.length === 0 || workers.length === 0) {
      setWorkerRoutes([]);
      return;
    }

    const calculateWorkerRoutes = async () => {
      const routes: WorkerRoute[] = [];
      const directionsService = new google.maps.DirectionsService();

      for (let i = 0; i < workers.length; i++) {
        const worker = workers[i];
        const workerJobs = jobs
          .filter(job => job.assignedUserIds.includes(worker.id))
          .filter(job => job.latitude && job.longitude)
          .sort((a, b) => {
            // Fixed jobs maintain their time, others sort by routeOrder or time
            if (a.routeOrder !== null && b.routeOrder !== null) {
              return (a.routeOrder || 0) - (b.routeOrder || 0);
            }
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
          });

        if (workerJobs.length === 0) continue;

        let directions: google.maps.DirectionsResult | null = null;
        let totalDistance = '0 mi';
        let totalDuration = '0 min';

        if (workerJobs.length >= 2) {
          try {
            const origin = { lat: workerJobs[0].latitude!, lng: workerJobs[0].longitude! };
            const destination = { lat: workerJobs[workerJobs.length - 1].latitude!, lng: workerJobs[workerJobs.length - 1].longitude! };
            const waypoints = workerJobs.slice(1, -1).map(job => ({
              location: { lat: job.latitude!, lng: job.longitude! },
              stopover: true
            }));

            const result = await directionsService.route({
              origin,
              destination,
              waypoints,
              travelMode: google.maps.TravelMode.DRIVING,
            });

            directions = result;

            let distance = 0;
            let duration = 0;
            result.routes[0].legs.forEach(leg => {
              distance += leg.distance?.value || 0;
              duration += leg.duration?.value || 0;
            });

            totalDistance = `${(distance / 1609.34).toFixed(1)} mi`;
            totalDuration = `${Math.round(duration / 60)} min`;
          } catch (error) {
            console.error(`Route calculation error for ${worker.firstName}:`, error);
          }
        }

        routes.push({
          workerId: worker.id,
          workerName: `${worker.firstName} ${worker.lastName}`,
          workerColor: worker.color || WORKER_COLORS[i % WORKER_COLORS.length],
          jobs: workerJobs,
          directions,
          totalDistance,
          totalDuration,
        });
      }

      setWorkerRoutes(routes);
    };

    calculateWorkerRoutes();
  }, [isLoaded, jobs, workers]);

  // Optimize routes for all workers (multi-worker optimization with auto-assign)
  const optimizeAllRoutes = async () => {
    if (!isLoaded || !providerId || workers.length === 0) return;

    setOptimizing(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const workerIds = workers.map(w => w.id);

      // Use the new optimize-all endpoint for multi-worker optimization
      const res = await fetch('/api/provider/dispatch/optimize-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          date: dateStr,
          workerIds,
          autoAssign: true, // Always auto-assign unassigned jobs
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to optimize routes');
      }

      // Store the optimization result for display
      setOptimizationResult(data);

      // Build success message
      let message = `Routes optimized! Saved ${data.totalSavedMiles?.toFixed(1) || 0} miles`;
      if (data.summary?.unassignedCount > 0) {
        message += ` (${data.summary.unassignedCount} jobs need manual assignment)`;
      }

      // Check for skill mismatches
      const hasIssues = (data.unassignableJobs?.length > 0) || (data.skillMismatches?.length > 0);
      if (data.skillMismatches?.length > 0) {
        setShowSkillMismatchModal(true);
      }

      setNotification({
        message,
        type: hasIssues ? 'error' : 'success'
      });

      // Refresh data to show updated assignments
      await fetchDispatchData();
    } catch (error) {
      console.error('Optimize error:', error);
      setNotification({ message: 'Failed to optimize routes', type: 'error' });
    } finally {
      setOptimizing(false);
    }
  };

  // Assign job to worker
  const assignJobToWorker = async (jobId: string, workerId: string) => {
    try {
      const res = await fetch(`/api/provider/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedUserIds: [workerId] }),
      });

      if (!res.ok) {
        throw new Error('Failed to assign job');
      }

      setNotification({ message: 'Job assigned successfully', type: 'success' });
      await fetchDispatchData();
    } catch (error) {
      console.error('Assign error:', error);
      setNotification({ message: 'Failed to assign job', type: 'error' });
    }
  };

  // Date navigation - reset initial load to re-center map for new date
  const goToDate = (days: number) => {
    setInitialLoadComplete(false);
    setSelectedDate(prev => addDays(prev, days));
  };

  const allJobsWithCoords = useMemo(() => {
    return [...jobs, ...unassignedJobs].filter(j => j.latitude && j.longitude);
  }, [jobs, unassignedJobs]);

  return (
    <ProviderLayout providerName={providerName}>
      <div className="flex flex-col h-[calc(100vh-72px)] bg-background relative">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
              notification.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dispatch Board</h1>
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')} - {jobs.length} jobs assigned, {unassignedJobs.length} unassigned
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Date Navigation */}
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToDate(-1)}
                  className="h-8 px-2"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </Button>
                <button
                  onClick={() => {
                    setInitialLoadComplete(false);
                    setSelectedDate(startOfDay(new Date()));
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    isToday(selectedDate)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  Today
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToDate(1)}
                  className="h-8 px-2"
                >
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </Button>
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDispatchData()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {/* Optimize All */}
              <Button
                onClick={optimizeAllRoutes}
                disabled={optimizing || (jobs.length < 2 && unassignedJobs.length === 0)}
                className="bg-primary hover:bg-primary/90"
              >
                {optimizing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Optimize All Routes
              </Button>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleStatusFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter.includes('all')
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                All
              </button>
              <button
                onClick={() => toggleStatusFilter('scheduled')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter.includes('scheduled')
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                }`}
              >
                Scheduled
              </button>
              <button
                onClick={() => toggleStatusFilter('on_the_way')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter.includes('on_the_way')
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                }`}
              >
                On the Way
              </button>
              <button
                onClick={() => toggleStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter.includes('in_progress')
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => toggleStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter.includes('completed')
                    ? 'bg-zinc-500 text-white'
                    : 'bg-zinc-500/10 text-zinc-600 hover:bg-zinc-500/20'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Worker Legend */}
          <div className="flex flex-wrap gap-3">
            {workerRoutes.map(route => (
              <button
                key={route.workerId}
                onClick={() => setSelectedWorker(
                  selectedWorker === route.workerId ? null : route.workerId
                )}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedWorker === route.workerId
                    ? 'ring-2 ring-primary ring-offset-2'
                    : selectedWorker && selectedWorker !== route.workerId
                    ? 'opacity-50'
                    : ''
                }`}
                style={{
                  backgroundColor: `${route.workerColor}20`,
                  color: route.workerColor,
                  borderColor: route.workerColor,
                  borderWidth: 1,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: route.workerColor }}
                />
                {route.workerName}
                <span className="text-xs opacity-70">({route.jobs.length})</span>
              </button>
            ))}
            {workerRoutes.length === 0 && workers.length > 0 && (
              <p className="text-sm text-muted-foreground">No jobs assigned yet</p>
            )}
            {/* Office location legend */}
            {officeLocation?.latitude && officeLocation?.longitude && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-500/10 text-indigo-600 border border-indigo-500/30">
                <Building2 className="w-3 h-3" />
                Office
              </div>
            )}
          </div>

          {/* Skill Mismatch Warning Banner */}
          {optimizationResult?.skillMismatches && optimizationResult.skillMismatches.length > 0 && (
            <button
              onClick={() => setShowSkillMismatchModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                {optimizationResult.skillMismatches.length} skill mismatch{optimizationResult.skillMismatches.length > 1 ? 'es' : ''}
              </span>
              <ChevronRight className="w-4 h-4 text-amber-500" />
            </button>
          )}

          {/* Needs Review Warning Banner */}
          {optimizationResult?.needsReview && optimizationResult.needsReview.length > 0 && (
            <button
              onClick={() => setShowNeedsReviewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                {optimizationResult.needsReview.length} job{optimizationResult.needsReview.length > 1 ? 's' : ''} need{optimizationResult.needsReview.length === 1 ? 's' : ''} review
              </span>
              <ChevronRight className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>

        {/* Main Content - Map and Panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Unassigned Jobs Panel */}
          {showUnassigned && unassignedJobs.length > 0 && (
            <div className="w-80 border-r border-border bg-card overflow-hidden flex flex-col">
              <div className="p-3 border-b border-border bg-amber-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-foreground">
                      Unassigned Jobs ({unassignedJobs.length})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUnassigned(false)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {unassignedJobs.map(job => (
                  <div
                    key={job.id}
                    className={`p-3 rounded-lg border border-border bg-background hover:bg-accent/50 cursor-pointer transition-colors ${
                      selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedJob(job);
                      if (job.latitude && job.longitude) {
                        setCenter({ lat: job.latitude, lng: job.longitude });
                        mapRef?.panTo({ lat: job.latitude, lng: job.longitude });
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getAppointmentTypeIcon(job.appointmentType)}
                        <span className="font-medium text-sm text-foreground">
                          {job.serviceType}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(job.startTime), 'h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {job.customer.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {job.address}
                    </p>

                    {/* Quick assign buttons */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {workers.slice(0, 4).map(worker => (
                        <button
                          key={worker.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            assignJobToWorker(job.id, worker.id);
                          }}
                          className="px-2 py-1 text-xs rounded font-medium hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: `${worker.color || '#10b981'}20`,
                            color: worker.color || '#10b981',
                          }}
                        >
                          {worker.firstName}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="flex-1 relative">
            {!isLoaded ? (
              <div className="flex items-center justify-center h-full bg-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full bg-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={12}
                onLoad={setMapRef}
                onClick={() => setSelectedJob(null)}
                options={{
                  styles: isDarkMode ? darkMapStyles : lightMapStyles,
                  disableDefaultUI: false,
                  zoomControl: true,
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: true,
                }}
              >
                {/* Worker routes */}
                {workerRoutes.map(route => {
                  if (!route.directions) return null;
                  if (selectedWorker && selectedWorker !== route.workerId) return null;

                  return (
                    <DirectionsRenderer
                      key={route.workerId}
                      directions={route.directions}
                      options={{
                        suppressMarkers: true,
                        polylineOptions: {
                          strokeColor: route.workerColor,
                          strokeWeight: 4,
                          strokeOpacity: 0.8,
                        },
                      }}
                    />
                  );
                })}

                {/* Assigned job markers */}
                {workerRoutes.flatMap(route => {
                  if (selectedWorker && selectedWorker !== route.workerId) return [];

                  const filteredJobs = filterJobsByStatus(route.jobs);
                  return filteredJobs.map((job, index) => (
                    <Marker
                      key={job.id}
                      position={{ lat: job.latitude!, lng: job.longitude! }}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: route.workerColor,
                        fillOpacity: 1,
                        strokeWeight: job.appointmentType === 'fixed' ? 4 : 2,
                        strokeColor: job.appointmentType === 'fixed' ? '#ef4444' : '#fff',
                        scale: 14,
                      }}
                      label={{
                        text: String(index + 1),
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                      onClick={() => setSelectedJob(job)}
                    />
                  ));
                })}

                {/* Unassigned job markers */}
                {filterJobsByStatus(unassignedJobs)
                  .filter(job => job.latitude && job.longitude)
                  .map(job => (
                    <Marker
                      key={job.id}
                      position={{ lat: job.latitude!, lng: job.longitude! }}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: '#f59e0b',
                        fillOpacity: 1,
                        strokeWeight: 3,
                        strokeColor: '#fff',
                        scale: 12,
                      }}
                      label={{
                        text: '?',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                      onClick={() => setSelectedJob(job)}
                    />
                  ))}

                {/* Office location marker */}
                {officeLocation?.latitude && officeLocation?.longitude && (
                  <Marker
                    position={{ lat: officeLocation.latitude, lng: officeLocation.longitude }}
                    icon={{
                      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                      fillColor: '#6366f1',
                      fillOpacity: 1,
                      strokeWeight: 2,
                      strokeColor: '#fff',
                      scale: 2,
                      anchor: new google.maps.Point(12, 24),
                    }}
                    title={`Office: ${officeLocation.name || 'Company HQ'}`}
                  />
                )}

                {/* Info window */}
                {selectedJob && selectedJob.latitude && selectedJob.longitude && (
                  <InfoWindow
                    position={{ lat: selectedJob.latitude, lng: selectedJob.longitude }}
                    onCloseClick={() => setSelectedJob(null)}
                  >
                    <div className="p-2 min-w-[220px] max-w-[300px] relative">
                      <button
                        onClick={() => setSelectedJob(null)}
                        className="absolute -top-1 -right-1 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                      >
                        <XCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                      <div className="flex items-center gap-2 mb-2 pr-6">
                        {getAppointmentTypeIcon(selectedJob.appointmentType)}
                        <p className="font-semibold text-gray-900">{selectedJob.serviceType}</p>
                      </div>
                      <p className="text-sm text-gray-600">{selectedJob.customer.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{selectedJob.address}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(parseISO(selectedJob.startTime), 'h:mm a')}
                        {selectedJob.estimatedArrival && (
                          <span className="text-emerald-600 ml-2">
                            ETA: {format(parseISO(selectedJob.estimatedArrival), 'h:mm a')}
                          </span>
                        )}
                      </p>

                      {selectedJob.assignedUserIds.length === 0 && (
                        <div className="mt-3 pt-2 border-t">
                          <p className="text-xs text-gray-500 mb-2">Assign to:</p>
                          <div className="flex flex-wrap gap-1">
                            {workers.map(worker => (
                              <button
                                key={worker.id}
                                onClick={() => assignJobToWorker(selectedJob.id, worker.id)}
                                className="px-2 py-1 text-xs rounded font-medium hover:opacity-80"
                                style={{
                                  backgroundColor: `${worker.color || '#10b981'}20`,
                                  color: worker.color || '#10b981',
                                }}
                              >
                                {worker.firstName}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => router.push(`/provider/jobs/${selectedJob.id}`)}
                          className="flex-1 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90"
                        >
                          View Job
                        </button>
                        <a
                          href={`https://maps.google.com/?daddr=${encodeURIComponent(selectedJob.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 bg-gray-100 text-gray-700 rounded text-sm flex items-center hover:bg-gray-200"
                        >
                          <Navigation className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}

            {/* No jobs overlay message */}
            {allJobsWithCoords.length === 0 && !loading && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-4 bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">No jobs scheduled</p>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedDate, 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {(nextJobDate || prevJobDate) && (
                  <div className="flex flex-wrap gap-2 justify-center border-t border-border pt-3">
                    {nextJobDate && (
                      <button
                        onClick={() => {
                          setInitialLoadComplete(false);
                          setSelectedDate(new Date(nextJobDate));
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-1"
                      >
                        Next job: {format(new Date(nextJobDate), 'MMM d')}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                    {prevJobDate && (
                      <button
                        onClick={() => {
                          setInitialLoadComplete(false);
                          setSelectedDate(new Date(prevJobDate));
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3 h-3" />
                        Previous: {format(new Date(prevJobDate), 'MMM d')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Toggle unassigned panel */}
            {!showUnassigned && unassignedJobs.length > 0 && (
              <button
                onClick={() => setShowUnassigned(true)}
                className="absolute top-4 left-4 px-4 py-2 bg-amber-500 text-white rounded-lg shadow-lg flex items-center gap-2 font-medium hover:bg-amber-600 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                {unassignedJobs.length} Unassigned
              </button>
            )}
          </div>

          {/* Worker Routes Panel */}
          <div className="w-96 border-l border-border bg-card overflow-hidden flex flex-col">
            <div className="p-3 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Worker Routes
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {workerRoutes.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No assigned jobs for this date</p>
                </div>
              ) : (
                workerRoutes.map(route => (
                  <div
                    key={route.workerId}
                    className={`border-b border-border ${
                      selectedWorker && selectedWorker !== route.workerId ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Worker header */}
                    <button
                      onClick={() => setSelectedWorker(
                        selectedWorker === route.workerId ? null : route.workerId
                      )}
                      className="w-full p-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: route.workerColor }}
                        >
                          {route.workerName.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">{route.workerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {route.jobs.length} jobs - {route.totalDistance} - {route.totalDuration}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform ${
                          selectedWorker === route.workerId ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Worker jobs */}
                    {selectedWorker === route.workerId && (
                      <div className="px-3 pb-3 space-y-2">
                        {route.jobs.map((job, index) => (
                          <div
                            key={job.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedJob?.id === job.id
                                ? 'bg-primary/10 ring-1 ring-primary'
                                : 'hover:bg-accent/50'
                            }`}
                            onClick={() => {
                              setSelectedJob(job);
                              if (job.latitude && job.longitude) {
                                setCenter({ lat: job.latitude, lng: job.longitude });
                                mapRef?.panTo({ lat: job.latitude, lng: job.longitude });
                              }
                            }}
                          >
                            {/* Order number */}
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: route.workerColor }}
                            >
                              {index + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {getAppointmentTypeIcon(job.appointmentType)}
                                <p className="text-sm font-medium text-foreground truncate">
                                  {job.serviceType}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {job.customer.name}
                              </p>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-medium text-foreground">
                                {format(parseISO(job.startTime), 'h:mm a')}
                              </p>
                              {job.estimatedArrival && (
                                <p className="text-xs text-emerald-500">
                                  ETA {format(parseISO(job.estimatedArrival), 'h:mm')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Skill Mismatch Modal */}
        {showSkillMismatchModal && optimizationResult?.skillMismatches && optimizationResult.skillMismatches.length > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-foreground">
                    Skill Mismatches Found
                  </h3>
                </div>
                <button
                  onClick={() => setShowSkillMismatchModal(false)}
                  className="p-1 hover:bg-accent rounded"
                >
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  {optimizationResult.skillMismatches.length} job(s) are assigned to workers without the required skills:
                </p>

                <div className="space-y-3">
                  {optimizationResult.skillMismatches.map((mismatch) => (
                    <div
                      key={mismatch.jobId}
                      className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {mismatch.jobTitle}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Assigned to: <span className="text-amber-600 font-medium">{mismatch.assignedWorkerName}</span>
                        </p>
                        <div className="mt-2 text-xs">
                          <p className="text-muted-foreground">
                            Worker skills: {mismatch.workerSkills.length > 0 ? mismatch.workerSkills.slice(0, 3).join(', ') : 'None'}
                            {mismatch.workerSkills.length > 3 && ` +${mismatch.workerSkills.length - 3} more`}
                          </p>
                          <p className="text-amber-600 mt-0.5">
                            Missing: {(mismatch.missingSkillNames || mismatch.requiredSkills).slice(0, 3).join(', ')}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              router.push(`/provider/jobs/${mismatch.jobId}`);
                              setShowSkillMismatchModal(false);
                            }}
                            className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                          >
                            Reassign
                          </button>
                          <button
                            onClick={() => {
                              setOverrideModalJob({
                                jobId: mismatch.jobId,
                                jobTitle: mismatch.jobTitle,
                                assignedWorkerId: mismatch.assignedWorkerId,
                                assignedWorkerName: mismatch.assignedWorkerName,
                                missingSkillNames: mismatch.missingSkillNames || mismatch.requiredSkills,
                              });
                              setShowSkillMismatchModal(false);
                            }}
                            className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
                          >
                            Allow Override
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSkillMismatchModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Needs Review Modal */}
        {showNeedsReviewModal && optimizationResult?.needsReview && optimizationResult.needsReview.length > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-foreground">
                    Jobs Requiring Manual Review
                  </h3>
                </div>
                <button
                  onClick={() => setShowNeedsReviewModal(false)}
                  className="p-1 hover:bg-accent rounded"
                >
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  These jobs cannot be auto-assigned and need manual action:
                </p>

                <div className="space-y-3">
                  {optimizationResult.needsReview.map((item) => (
                    <div
                      key={item.jobId}
                      className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {item.jobTitle}
                        </p>
                        <div className="mt-2 text-xs">
                          <p className={`font-medium ${
                            item.reason === 'MULTI_WORKER_REQUIRED' ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {item.reason === 'MULTI_WORKER_REQUIRED' && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {item.message}
                              </span>
                            )}
                            {item.reason === 'NO_QUALIFIED_WORKERS' && (
                              <span>
                                {item.message}
                                {item.requiredSkillNames && item.requiredSkillNames.length > 0 && (
                                  <span className="block mt-1 text-muted-foreground">
                                    Required: {item.requiredSkillNames.join(', ')}
                                  </span>
                                )}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              router.push(`/provider/jobs/${item.jobId}`);
                              setShowNeedsReviewModal(false);
                            }}
                            className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                          >
                            {item.reason === 'MULTI_WORKER_REQUIRED' ? 'Assign Workers' : 'View Job'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNeedsReviewModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Override Confirmation Modal */}
        {overrideModalJob && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-foreground">
                    Override Skill Requirement
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setOverrideModalJob(null);
                    setOverrideReason('');
                  }}
                  className="p-1 hover:bg-accent rounded"
                >
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="font-medium text-foreground text-sm">
                    {overrideModalJob.jobTitle}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Worker: <span className="text-amber-600 font-medium">{overrideModalJob.assignedWorkerName}</span>
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Missing: {overrideModalJob.missingSkillNames.join(', ')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Reason for override: *
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g., Customer requested specific technician"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm resize-none"
                    rows={3}
                  />
                </div>

                <div className="p-2 bg-amber-500/10 rounded text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  This override will be logged for compliance purposes.
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOverrideModalJob(null);
                    setOverrideReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={!overrideReason.trim()}
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/provider/jobs/${overrideModalJob.jobId}/override`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          reason: overrideReason,
                          assignedWorkerId: overrideModalJob.assignedWorkerId,
                        }),
                      });

                      if (res.ok) {
                        setNotification({ message: 'Skill override applied', type: 'success' });
                        // Remove this job from mismatches in the local state
                        if (optimizationResult) {
                          setOptimizationResult({
                            ...optimizationResult,
                            skillMismatches: optimizationResult.skillMismatches.filter(
                              m => m.jobId !== overrideModalJob.jobId
                            ),
                          });
                        }
                      } else {
                        const data = await res.json();
                        setNotification({ message: data.error || 'Failed to apply override', type: 'error' });
                      }
                    } catch (error) {
                      setNotification({ message: 'Failed to apply override', type: 'error' });
                    }
                    setOverrideModalJob(null);
                    setOverrideReason('');
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Confirm Override
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}
