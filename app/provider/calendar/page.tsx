"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Phone, Star, X, Mail, MessageSquare, DollarSign, Home, User, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  customerName: string;
  firstName: string;
  lastName: string;
  serviceType: string;
  scheduledDate: string;
  status: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyValue: number;
  leadScore: number;
  createdAt: string;
}

interface WorkingHours {
  monday: Array<{ start: string; end: string }>;
  tuesday: Array<{ start: string; end: string }>;
  wednesday: Array<{ start: string; end: string }>;
  thursday: Array<{ start: string; end: string }>;
  friday: Array<{ start: string; end: string }>;
  saturday: Array<{ start: string; end: string }>;
  sunday: Array<{ start: string; end: string }>;
}

export default function ProviderCalendar() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [selectedLead, setSelectedLead] = useState<Appointment | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');
    
    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    fetchAppointments(id);
    fetchAvailability(id);
  }, [router]);

  const fetchAppointments = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/leads?providerId=${id}`);
      const data = await res.json();
      
      if (data.leads) {
        const confirmed = data.leads
          .filter((lead: any) => 
            lead.schedulingStatus === 'confirmed' && lead.providerProposedDate
          )
          .map((lead: any) => ({
            id: lead.id,
            customerName: `${lead.firstName} ${lead.lastName}`,
            firstName: lead.firstName,
            lastName: lead.lastName,
            serviceType: lead.serviceInterest,
            scheduledDate: lead.providerProposedDate,
            status: lead.status,
            phone: lead.phone,
            email: lead.email,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            zipCode: lead.zipCode,
            propertyValue: lead.propertyValue,
            leadScore: lead.leadScore,
            createdAt: lead.createdAt,
          }));
        
        setAppointments(confirmed);
      }
    } catch (error) {
      toast.error('Failed to load appointments');
    }
  };

  const fetchAvailability = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/availability?providerId=${id}`);
      const data = await res.json();
      
      if (data.workingHours) {
        setWorkingHours(data.workingHours);
      }
    } catch (error) {
      console.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    let startingDayOfWeek = firstDay.getDay();
    // Convert to Monday-based (0 = Monday, 6 = Sunday)
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledDate);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isDayAvailable = (date: Date) => {
    if (!workingHours) return true;
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()] as keyof WorkingHours;
    
    return workingHours[dayName] && workingHours[dayName].length > 0;
  };

  const getNextAppointment = () => {
    const now = new Date();
    const upcoming = appointments
      .filter(apt => new Date(apt.scheduledDate) > now)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    
    return upcoming[0] || null;
  };

  const getMonthAppointments = () => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledDate);
      return (
        aptDate.getMonth() === currentDate.getMonth() &&
        aptDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dayAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];
  const nextAppointment = getNextAppointment();
  const monthAppointments = getMonthAppointments();

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950">
        {/* Header with Stats */}
        <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-zinc-100">Calendar</h1>
                <p className="text-xs text-zinc-400 mt-1">Manage your appointments and schedule</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => changeMonth(-1)}
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-zinc-100 font-semibold px-6 min-w-[200px] text-center text-lg">
                  {monthName}
                </div>
                <Button
                  onClick={() => changeMonth(1)}
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/20 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-400 font-medium mb-1">NEXT UP</p>
                    {nextAppointment ? (
                      <>
                        <p className="text-base font-bold text-zinc-100">{nextAppointment.customerName}</p>
                        <p className="text-xs text-zinc-400 mt-1">{formatTime(nextAppointment.scheduledDate)}</p>
                      </>
                    ) : (
                      <p className="text-sm text-zinc-500">No upcoming</p>
                    )}
                  </div>
                  <Clock className="h-6 w-6 text-blue-400/30" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-500/20 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-400 font-medium mb-1">THIS MONTH</p>
                    <p className="text-2xl font-bold text-zinc-100">{monthAppointments.length}</p>
                    <p className="text-xs text-zinc-400 mt-1">appointments</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-400/30" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border border-purple-500/20 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-400 font-medium mb-1">TOTAL</p>
                    <p className="text-2xl font-bold text-zinc-100">{appointments.length}</p>
                    <p className="text-xs text-zinc-400 mt-1">all time</p>
                  </div>
                  <CalendarIcon className="h-6 w-6 text-purple-400/30" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-zinc-900/80 border-b border-zinc-800/50">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <div key={day} className="text-center py-2 text-xs font-semibold text-zinc-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="min-h-[100px] border-r border-b border-zinc-800/30" />;
                }

                const dayAppointments = getAppointmentsForDate(date);
                const hasAppointments = dayAppointments.length > 0;
                const isTodayDate = isToday(date);
                const isAvailable = isDayAvailable(date);

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[100px] p-2 border-r border-b border-zinc-800/30 transition-colors
                      ${!isAvailable ? 'bg-red-500/5' : 'hover:bg-zinc-800/30'}
                    `}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`
                          text-sm font-medium
                          ${isTodayDate 
                            ? 'bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center' 
                            : !isAvailable
                            ? 'text-red-400/60'
                            : 'text-zinc-300'
                          }
                        `}>
                          {date.getDate()}
                        </span>
                        {!isAvailable && !hasAppointments && (
                          <span className="text-xs text-red-400/60 font-medium">OFF</span>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        {dayAppointments.map((apt, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedLead(apt)}
                            className="w-full px-2 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-left transition-all group"
                          >
                            <p className="text-xs font-medium text-blue-400 group-hover:text-blue-300 truncate">
                              {formatTime(apt.scheduledDate)}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">
                              {apt.customerName}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-base">
                  {selectedLead.firstName[0]}{selectedLead.lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-100">{selectedLead.customerName}</h2>
                  <p className="text-xs text-zinc-400 capitalize">{selectedLead.serviceType}</p>
                </div>
              </div>
              <Button
                onClick={() => setSelectedLead(null)}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4">
              {/* Lead Score */}
              <div className="mb-4 p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                    <div>
                      <p className="text-xs text-zinc-400">Lead Score</p>
                      <p className="text-2xl font-bold text-zinc-100">{selectedLead.leadScore}</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${
                    selectedLead.leadScore >= 80 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    selectedLead.leadScore >= 60 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    <span className="font-semibold">
                      {selectedLead.leadScore >= 80 ? 'Hot Lead' : selectedLead.leadScore >= 60 ? 'Warm Lead' : 'Cold Lead'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Appointment</p>
                      <p className="text-sm font-semibold text-zinc-100">{formatDate(selectedLead.scheduledDate)}</p>
                      <p className="text-xs text-zinc-400">{formatTime(selectedLead.scheduledDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Property Value</p>
                      <p className="text-base font-bold text-zinc-100">
                        ${selectedLead.propertyValue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50 mb-4">
                <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-zinc-500" />
                    <span className="text-zinc-400">Phone:</span>
                    <a href={`tel:${selectedLead.phone}`} className="text-blue-400 hover:text-blue-300 font-medium">
                      {selectedLead.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-zinc-500" />
                    <span className="text-zinc-400">Email:</span>
                    <a href={`mailto:${selectedLead.email}`} className="text-blue-400 hover:text-blue-300 font-medium">
                      {selectedLead.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Property Info */}
              <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50 mb-4">
                <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Property Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-zinc-500 mt-0.5" />
                    <div>
                      <p className="text-zinc-300">{selectedLead.address}</p>
                      <p className="text-zinc-400">{selectedLead.city}, {selectedLead.state} {selectedLead.zipCode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => window.location.href = `tel:${selectedLead.phone}`}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button
                  onClick={() => window.location.href = `mailto:${selectedLead.email}`}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  onClick={() => router.push(`/provider/dashboard#${selectedLead.id}`)}
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}
