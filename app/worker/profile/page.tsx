'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WorkerLayout from '@/components/worker/WorkerLayout';
import {
  User,
  Mail,
  Phone,
  Clock,
  Award,
  DollarSign,
  LogOut,
  MessageCircle,
  Loader2,
  Building,
  Save,
  Edit2,
  X,
  Lock,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

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

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
];

export default function WorkerProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Form data
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [availabilityForm, setAvailabilityForm] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // UI states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/worker/profile?userId=${uid}`);
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        setProfileForm({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          phone: data.user.phone || '',
        });
        // Initialize availability form
        const avail: Record<string, { enabled: boolean; start: string; end: string }> = {};
        DAYS.forEach(({ key }) => {
          const hours = data.user.workingHours?.[key];
          avail[key] = {
            enabled: !!hours,
            start: hours?.start || '08:00',
            end: hours?.end || '17:00',
          };
        });
        setAvailabilityForm(avail);
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

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);

    try {
      const res = await fetch('/api/worker/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, ...data.user });
        setEditingProfile(false);
        toast.success('Profile updated');
        // Update localStorage
        localStorage.setItem('workerFirstName', data.user.firstName);
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAvailability = async () => {
    if (!profile) return;
    setSavingAvailability(true);

    try {
      // Convert form to API format
      const workingHours: Record<string, { start: string; end: string }> = {};
      Object.entries(availabilityForm).forEach(([day, data]) => {
        if (data.enabled) {
          workingHours[day] = { start: data.start, end: data.end };
        }
      });

      const res = await fetch('/api/worker/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          workingHours: Object.keys(workingHours).length > 0 ? workingHours : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, workingHours: data.workingHours });
        setEditingAvailability(false);
        toast.success('Availability updated');
      } else {
        toast.error(data.error || 'Failed to update availability');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleChangePassword = async () => {
    if (!profile) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch('/api/worker/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setChangingPassword(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Password changed successfully');
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSavingPassword(false);
    }
  };

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
      <div className="p-4 space-y-6 pb-24">
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

        {/* Personal Information - Editable */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-white">Personal Information</h2>
            </div>
            {!editingProfile ? (
              <button
                onClick={() => setEditingProfile(true)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileForm({
                      firstName: profile.firstName || '',
                      lastName: profile.lastName || '',
                      phone: profile.phone || '',
                    });
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-zinc-800">
            {editingProfile ? (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">First Name</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Phone</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: formatPhoneNumber(e.target.value) })}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4">
                  <Mail className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-500">Email</p>
                    <span className="text-white">{profile.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4">
                  <Phone className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-500">Phone</p>
                    <span className="text-white">{profile.phone || 'Not set'}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pay Info - View Only */}
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-white">Pay Rate</h2>
            <span className="text-xs text-zinc-500 ml-auto">Set by admin</span>
          </div>
          <p className="text-2xl font-bold text-white">{getPayDisplay()}</p>
        </div>

        {/* Skills - View Only */}
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-yellow-400" />
            <h2 className="font-semibold text-white">My Skills</h2>
            <span className="text-xs text-zinc-500 ml-auto">Assigned by admin</span>
          </div>
          {profile.workerSkills.length > 0 ? (
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
          ) : (
            <p className="text-zinc-500 text-sm">No skills assigned yet</p>
          )}
        </div>

        {/* Availability - Editable */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-white">Availability</h2>
            </div>
            {!editingAvailability ? (
              <button
                onClick={() => setEditingAvailability(true)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingAvailability(false);
                    // Reset form
                    const avail: Record<string, { enabled: boolean; start: string; end: string }> = {};
                    DAYS.forEach(({ key }) => {
                      const hours = profile.workingHours?.[key];
                      avail[key] = {
                        enabled: !!hours,
                        start: hours?.start || '08:00',
                        end: hours?.end || '17:00',
                      };
                    });
                    setAvailabilityForm(avail);
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSaveAvailability}
                  disabled={savingAvailability}
                  className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {savingAvailability ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          <div className="p-4">
            {editingAvailability ? (
              <div className="space-y-3">
                {DAYS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <button
                      onClick={() => setAvailabilityForm({
                        ...availabilityForm,
                        [key]: { ...availabilityForm[key], enabled: !availabilityForm[key].enabled }
                      })}
                      className={`w-12 flex items-center justify-center py-1 rounded text-sm font-medium transition-colors ${
                        availabilityForm[key]?.enabled
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {label}
                    </button>
                    {availabilityForm[key]?.enabled && (
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          value={availabilityForm[key]?.start || '08:00'}
                          onChange={(e) => setAvailabilityForm({
                            ...availabilityForm,
                            [key]: { ...availabilityForm[key], start: e.target.value }
                          })}
                          className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                        >
                          {TIME_OPTIONS.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <span className="text-zinc-500">to</span>
                        <select
                          value={availabilityForm[key]?.end || '17:00'}
                          onChange={(e) => setAvailabilityForm({
                            ...availabilityForm,
                            [key]: { ...availabilityForm[key], end: e.target.value }
                          })}
                          className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                        >
                          {TIME_OPTIONS.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {DAYS.map(({ key, label }) => {
                  const hours = profile.workingHours?.[key];
                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-zinc-400">{label}</span>
                      {hours ? (
                        <span className="text-white">{hours.start} - {hours.end}</span>
                      ) : (
                        <span className="text-zinc-600">Off</span>
                      )}
                    </div>
                  );
                })}
                {!profile.workingHours && (
                  <p className="text-zinc-500 text-sm text-center py-2">No availability set</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-400" />
              <h2 className="font-semibold text-white">Password</h2>
            </div>
            {!changingPassword && (
              <button
                onClick={() => setChangingPassword(true)}
                className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Change
              </button>
            )}
          </div>

          {changingPassword && (
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                />
                {passwordForm.newPassword && passwordForm.confirmPassword && (
                  <div className="flex items-center gap-1 mt-1">
                    {passwordForm.newPassword === passwordForm.confirmPassword ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-emerald-400">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-red-400">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 py-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Password'}
                </button>
              </div>
            </div>
          )}
        </div>

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
