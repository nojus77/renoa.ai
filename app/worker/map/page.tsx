'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import WorkerLayout from '@/components/worker/WorkerLayout';
import { MapPin, Navigation, Clock, ChevronRight, Route, Loader2, Calendar } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

// Renoa Design System
const LIME_GREEN = '#C4F542';

interface Job {
  id: string;
  serviceType: string;
  status: string;
  scheduledDate: string;
  startTime: string;
  endTime?: string;
  address: string;
  customer: {
    name: string;
    phone?: string;
    address: string | null;
  };
  latitude?: number | null;
  longitude?: number | null;
  order?: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

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
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
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

const formatJobDate = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
};

export default function WorkerMapPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('today');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [showRoute, setShowRoute] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [totalDistance, setTotalDistance] = useState<string>('');
  const [totalDuration, setTotalDuration] = useState<string>('');
  const [center, setCenter] = useState({ lat: 41.8781, lng: -87.6298 }); // Default Chicago
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem('workerUserId');
        if (!userId) {
          router.push('/worker/login');
          return;
        }

        const res = await fetch(`/api/worker/jobs/map?userId=${userId}&filter=${filter}`);
        const data = await res.json();

        if (data.jobs?.length > 0) {
          setJobs(data.jobs);
          // Center on first job with coordinates
          const firstWithCoords = data.jobs.find((j: Job) => j.latitude && j.longitude);
          if (firstWithCoords) {
            setCenter({ lat: firstWithCoords.latitude!, lng: firstWithCoords.longitude! });
          }
        } else {
          setJobs([]);
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [filter, router]);

  // Calculate route when jobs change
  const calculateRoute = useCallback(async () => {
    if (!isLoaded || jobs.length < 2) {
      setDirections(null);
      setTotalDistance('');
      setTotalDuration('');
      return;
    }

    const jobsWithCoords = jobs.filter(j => j.latitude && j.longitude);
    if (jobsWithCoords.length < 2) {
      setDirections(null);
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    // Sort jobs by scheduled time
    const sortedJobs = [...jobsWithCoords].sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const origin = { lat: sortedJobs[0].latitude!, lng: sortedJobs[0].longitude! };
    const destination = { lat: sortedJobs[sortedJobs.length - 1].latitude!, lng: sortedJobs[sortedJobs.length - 1].longitude! };

    const waypoints = sortedJobs.slice(1, -1).map(job => ({
      location: { lat: job.latitude!, lng: job.longitude! },
      stopover: true
    }));

    try {
      const result = await directionsService.route({
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      });

      setDirections(result);

      // Calculate totals
      const route = result.routes[0];
      let distance = 0;
      let duration = 0;
      route.legs.forEach(leg => {
        distance += leg.distance?.value || 0;
        duration += leg.duration?.value || 0;
      });

      setTotalDistance(`${(distance / 1609.34).toFixed(1)} mi`);
      setTotalDuration(`${Math.round(duration / 60)} min`);
    } catch (error) {
      console.error('Directions error:', error);
    }
  }, [isLoaded, jobs]);

  useEffect(() => {
    if (showRoute) {
      calculateRoute();
    } else {
      setDirections(null);
    }
  }, [showRoute, calculateRoute]);

  // Optimize route
  const optimizeRoute = async () => {
    if (!isLoaded || jobs.length < 3) return;

    setOptimizing(true);

    const jobsWithCoords = jobs.filter(j => j.latitude && j.longitude);
    if (jobsWithCoords.length < 3) {
      setOptimizing(false);
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    const origin = { lat: jobsWithCoords[0].latitude!, lng: jobsWithCoords[0].longitude! };
    const destination = { lat: jobsWithCoords[jobsWithCoords.length - 1].latitude!, lng: jobsWithCoords[jobsWithCoords.length - 1].longitude! };

    const waypoints = jobsWithCoords.slice(1, -1).map(job => ({
      location: { lat: job.latitude!, lng: job.longitude! },
      stopover: true
    }));

    try {
      const result = await directionsService.route({
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      });

      setDirections(result);

      // Reorder jobs based on optimized route
      const waypointOrder = result.routes[0].waypoint_order;
      const middleJobs = jobsWithCoords.slice(1, -1);
      const reorderedMiddle = waypointOrder.map(i => middleJobs[i]);
      const optimizedJobs = [
        jobsWithCoords[0],
        ...reorderedMiddle,
        jobsWithCoords[jobsWithCoords.length - 1]
      ].map((job, index) => ({ ...job, order: index + 1 }));

      setJobs(optimizedJobs);

      // Recalculate totals
      const route = result.routes[0];
      let distance = 0;
      let duration = 0;
      route.legs.forEach(leg => {
        distance += leg.distance?.value || 0;
        duration += leg.duration?.value || 0;
      });

      setTotalDistance(`${(distance / 1609.34).toFixed(1)} mi`);
      setTotalDuration(`${Math.round(duration / 60)} min`);
    } catch (error) {
      console.error('Optimize error:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const openInMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${encoded}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
    }
  };

  const jobsWithCoords = jobs.filter(j => j.latitude && j.longitude);

  return (
    <WorkerLayout>
      <div className="flex flex-col h-[calc(100vh-80px)] bg-black">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-[#1F1F1F]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-white">Job Map</h1>
              <p className="text-sm text-zinc-400">{jobsWithCoords.length} jobs with locations</p>
            </div>

            {jobsWithCoords.length >= 3 && (
              <button
                onClick={optimizeRoute}
                disabled={optimizing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium disabled:opacity-50 text-black"
                style={{ backgroundColor: LIME_GREEN }}
              >
                {optimizing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Route className="w-4 h-4" />
                )}
                Optimize
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {(['today', 'week', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === f
                    ? 'text-black'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
                style={filter === f ? { backgroundColor: LIME_GREEN } : undefined}
              >
                {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'All'}
              </button>
            ))}
          </div>

          {/* Route stats */}
          {directions && (
            <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-700">
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="w-4 h-4" style={{ color: LIME_GREEN }} />
                <span className="text-white">{totalDistance}</span>
                <span className="text-zinc-500">total</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" style={{ color: LIME_GREEN }} />
                <span className="text-white">{totalDuration}</span>
                <span className="text-zinc-500">driving</span>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {!isLoaded ? (
            <div className="flex items-center justify-center h-full bg-zinc-900">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: LIME_GREEN }} />
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full bg-zinc-900">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: LIME_GREEN }} />
            </div>
          ) : jobsWithCoords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-zinc-900">
              <MapPin className="w-16 h-16 text-zinc-700 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Jobs Found</h3>
              <p className="text-zinc-400">
                {jobs.length > 0
                  ? 'Jobs found but no valid coordinates. Addresses may need geocoding.'
                  : 'No jobs with valid addresses for the selected period.'}
              </p>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={12}
              onLoad={setMapRef}
              options={{
                styles: darkMapStyles,
                disableDefaultUI: true,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
              }}
            >
              {/* Job markers */}
              {jobsWithCoords.map((job, index) => (
                <Marker
                  key={job.id}
                  position={{ lat: job.latitude!, lng: job.longitude! }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: getStatusColor(job.status),
                    fillOpacity: 1,
                    strokeWeight: 3,
                    strokeColor: '#fff',
                    scale: 12,
                  }}
                  label={{
                    text: String(job.order || index + 1),
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                  onClick={() => setSelectedJob(job)}
                />
              ))}

              {/* Route */}
              {directions && showRoute && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: LIME_GREEN,
                      strokeWeight: 4,
                      strokeOpacity: 0.8,
                    },
                  }}
                />
              )}

              {/* Info window */}
              {selectedJob && selectedJob.latitude && selectedJob.longitude && (
                <InfoWindow
                  position={{ lat: selectedJob.latitude, lng: selectedJob.longitude }}
                  onCloseClick={() => setSelectedJob(null)}
                >
                  <div className="p-2 min-w-[200px] max-w-[280px]">
                    <p className="font-semibold text-gray-900">{selectedJob.serviceType}</p>
                    <p className="text-sm text-gray-600">{selectedJob.customer.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {format(parseISO(selectedJob.startTime), 'h:mm a')}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => router.push(`/worker/job/${selectedJob.id}`)}
                        className="flex-1 py-2 text-white rounded text-sm font-medium"
                        style={{ backgroundColor: '#10b981' }}
                      >
                        View Job
                      </button>
                      <a
                        href={`https://maps.google.com/?daddr=${encodeURIComponent(selectedJob.address || selectedJob.customer.address || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 bg-gray-100 text-gray-700 rounded text-sm flex items-center"
                      >
                        <Navigation className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}

          {/* Route toggle */}
          {jobsWithCoords.length >= 2 && (
            <button
              onClick={() => setShowRoute(!showRoute)}
              className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
                showRoute
                  ? 'text-black'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
              style={showRoute ? { backgroundColor: LIME_GREEN } : undefined}
            >
              {showRoute ? 'Hide Route' : 'Show Route'}
            </button>
          )}
        </div>

        {/* Job list drawer */}
        <div className="h-48 bg-zinc-900 border-t border-zinc-800 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs text-zinc-500 px-2 mb-2">STOPS IN ORDER</p>
            {jobs.length === 0 ? (
              <p className="text-sm text-zinc-500 px-2">No jobs to display</p>
            ) : (
              jobs.map((job, index) => (
                <div
                  key={job.id}
                  onClick={() => {
                    if (job.latitude && job.longitude) {
                      setCenter({ lat: job.latitude, lng: job.longitude });
                      setSelectedJob(job);
                      mapRef?.panTo({ lat: job.latitude, lng: job.longitude });
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedJob?.id === job.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                  }`}
                >
                  {/* Order number */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      job.status === 'completed'
                        ? 'bg-zinc-700 text-zinc-400'
                        : 'text-black'
                    }`}
                    style={job.status !== 'completed' ? { backgroundColor: LIME_GREEN } : undefined}
                  >
                    {job.order || index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{job.serviceType}</p>
                    <p className="text-sm text-zinc-400 truncate">{job.customer.name}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatJobDate(job.scheduledDate)}</span>
                      <Clock className="w-3 h-3 ml-1" />
                      <span>{format(parseISO(job.startTime), 'h:mm a')}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </WorkerLayout>
  );
}
