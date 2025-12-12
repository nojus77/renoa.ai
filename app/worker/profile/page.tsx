'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WorkerLayout from '@/components/worker/WorkerLayout';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Award,
  DollarSign,
  LogOut,
  MessageCircle,
  Loader2,
  Building,
} from 'lucide-react';

interface Skill {
  skill: {
    id: string;
    name: string;
  };
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  role: string;
  status: string;
  hourlyRate: number | null;
  payType: string | null;
  commissionRate: number | null;
  workingHours: Record<string, { start: string; end: string }> | null;
  homeAddress: string | null;
  workerSkills: Skill[];
  provider: {
    id: string;
    businessName: string;
    phone: string;
    email: string;
  };
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function WorkerProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/worker/profile?userId=${uid}`);
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem('workerUserId');
    if (!uid) {
      router.push('/provider/login');
      return;
    }
    fetchProfile(uid);
  }, [router, fetchProfile]);

  const handleLogout = () => {
    localStorage.removeItem('workerUserId');
    localStorage.removeItem('workerProviderId');
    localStorage.removeItem('workerFirstName');
    router.push('/provider/login');
  };

  const handleContactOffice = () => {
    if (profile?.provider.phone) {
      window.location.href = `tel:${profile.provider.phone}`;
    }
  };

  const getPayDisplay = () => {
    if (!profile) return 'Not set';
    if (profile.payType === 'hourly' && profile.hourlyRate) {
      return `$${profile.hourlyRate}/hour`;
    }
    if (profile.payType === 'commission' && profile.commissionRate) {
      return `${profile.commissionRate}% commission`;
    }
    return 'Not set';
  };

  const formatWorkingHours = () => {
    if (!profile?.workingHours) return null;

    return DAYS.map((day) => {
      const hours = profile.workingHours?.[day];
      if (!hours) return null;

      return (
        <div key={day} className="flex justify-between text-sm">
          <span className="text-zinc-400 capitalize">{day}</span>
          <span className="text-white">
            {hours.start} - {hours.end}
          </span>
        </div>
      );
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </WorkerLayout>
    );
  }

  if (!profile) {
    return (
      <WorkerLayout>
        <div className="p-4 text-center">
          <p className="text-zinc-400">Failed to load profile</p>
        </div>
      </WorkerLayout>
    );
  }

  return (
    <WorkerLayout>
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
            {profile.profilePhotoUrl ? (
              <img
                src={profile.profilePhotoUrl}
                alt={profile.firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-zinc-500" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-zinc-400 capitalize">{profile.role} Worker</p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                profile.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-zinc-700 text-zinc-400'
              }`}
            >
              {profile.status}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 divide-y divide-zinc-800">
          <div className="flex items-center gap-3 p-4">
            <Mail className="w-5 h-5 text-zinc-400" />
            <span className="text-white">{profile.email}</span>
          </div>
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="flex items-center gap-3 p-4 hover:bg-zinc-800 transition-colors"
            >
              <Phone className="w-5 h-5 text-zinc-400" />
              <span className="text-emerald-400">{profile.phone}</span>
            </a>
          )}
          {profile.homeAddress && (
            <div className="flex items-center gap-3 p-4">
              <MapPin className="w-5 h-5 text-zinc-400" />
              <span className="text-white text-sm">{profile.homeAddress}</span>
            </div>
          )}
        </div>

        {/* Pay Info */}
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-white">Pay Rate</h2>
          </div>
          <p className="text-2xl font-bold text-white">{getPayDisplay()}</p>
        </div>

        {/* Skills */}
        {profile.workerSkills.length > 0 && (
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-yellow-400" />
              <h2 className="font-semibold text-white">My Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.workerSkills.map((ws) => (
                <span
                  key={ws.skill.id}
                  className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-300"
                >
                  {ws.skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Working Hours */}
        {profile.workingHours && (
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-white">Working Hours</h2>
            </div>
            <div className="space-y-2">{formatWorkingHours()}</div>
          </div>
        )}

        {/* Company Info */}
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <Building className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold text-white">Company</h2>
          </div>
          <p className="text-white font-medium">{profile.provider.businessName}</p>
          <p className="text-zinc-400 text-sm mt-1">{profile.provider.email}</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleContactOffice}
            className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Contact Office
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </div>
    </WorkerLayout>
  );
}
