'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import WorkerLayout from '@/components/worker/WorkerLayout';
import {
  User,
  Mail,
  Phone,
  Award,
  DollarSign,
  LogOut,
  Loader2,
  Building,
  Save,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Camera,
  Briefcase,
  Star,
  ChevronRight,
  Bell,
  Shield,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SkillsCheckboxPicker, { WorkerSkill } from '@/components/provider/SkillsCheckboxPicker';

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
    logoUrl?: string | null;
    primaryCategory?: string | null;
    workersCanEditSkills?: boolean;
    workersCanEditAvailability?: boolean;
  };
}

export default function WorkerProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobsThisWeek, setJobsThisWeek] = useState(0);

  // Form data
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Skills state
  const [workerSkills, setWorkerSkills] = useState<WorkerSkill[]>([]);

  // UI states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/worker/profile?userId=${uid}`);
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        if (data.stats?.jobsThisWeek !== undefined) {
          setJobsThisWeek(data.stats.jobsThisWeek);
        }
        setProfileForm({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          phone: data.user.phone || '',
        });

        // Initialize worker skills
        if (data.user.workerSkills) {
          setWorkerSkills(data.user.workerSkills.map((ws: Skill) => ({
            id: ws.skill.id,
            skillId: ws.skill.id,
            skill: ws.skill,
          })));
        }
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

  // Track profile changes
  useEffect(() => {
    if (profile) {
      const changed =
        profileForm.firstName !== (profile.firstName || '') ||
        profileForm.lastName !== (profile.lastName || '') ||
        profileForm.phone !== (profile.phone || '');
      setHasProfileChanges(changed);
    }
  }, [profileForm, profile]);

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
        toast.success('Profile updated successfully');
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo too large. Max 5MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', profile.id);

      const res = await fetch('/api/worker/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setProfile({ ...profile, profilePhotoUrl: data.url });
        toast.success('Photo updated!');
      } else {
        toast.error(data.error || 'Failed to upload photo');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
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
        setPasswordModalOpen(false);
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
    if (!profile) return { value: 'Not set', subtitle: '' };
    if (profile.payType === 'hourly' && profile.hourlyRate) {
      return { value: `$${profile.hourlyRate}`, subtitle: 'per hour' };
    }
    if (profile.payType === 'commission' && profile.commissionRate) {
      return { value: `${profile.commissionRate}%`, subtitle: 'commission' };
    }
    return { value: 'Not set', subtitle: '' };
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

  const payInfo = getPayDisplay();

  return (
    <WorkerLayout>
      <div className="min-h-screen bg-zinc-950 pb-28">
        {/* Header Card with Gradient */}
        <div className="bg-gradient-to-br from-emerald-600/20 via-zinc-900 to-zinc-950 border-b border-zinc-800">
          <div className="px-4 py-8">
            <div className="flex flex-col items-center text-center">
              {/* Profile Photo */}
              <div className="relative group mb-4">
                <div className="w-28 h-28 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center overflow-hidden">
                  {profile.profilePhotoUrl ? (
                    <img
                      src={profile.profilePhotoUrl}
                      alt={profile.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-zinc-500" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-9 h-9 bg-emerald-600 hover:bg-emerald-500 rounded-full flex items-center justify-center transition-colors shadow-lg cursor-pointer">
                  {uploadingPhoto ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>

              {/* Name and Title */}
              <h1 className="text-2xl font-bold text-white mb-1">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-zinc-400 mb-3">
                Field Worker at <span className="text-emerald-400">{profile.provider.businessName}</span>
              </p>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                  profile.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${profile.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {profile.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-4 -mt-4">
          <div className="grid grid-cols-3 gap-3">
            {/* This Week */}
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-lg mb-3 mx-auto">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white text-center">{jobsThisWeek}</p>
              <p className="text-xs text-zinc-500 text-center">Jobs this week</p>
            </div>

            {/* Pay Rate */}
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/20 rounded-lg mb-3 mx-auto">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white text-center">{payInfo.value}</p>
              <p className="text-xs text-zinc-500 text-center">{payInfo.subtitle || 'Pay rate'}</p>
            </div>

            {/* Rating */}
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-center justify-center w-10 h-10 bg-yellow-500/20 rounded-lg mb-3 mx-auto">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-white text-center">--</p>
              <p className="text-xs text-zinc-500 text-center">No reviews yet</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 mt-6 space-y-6">
          {/* Two Column Layout for Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Personal Information Card */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="p-6 border-b border-zinc-800">
                  <h2 className="text-lg font-semibold text-white">Personal Information</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">First Name</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        className="w-full h-11 px-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="w-full h-11 px-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: formatPhoneNumber(e.target.value) })}
                      placeholder="(555) 123-4567"
                      className="w-full h-11 px-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Email Address</label>
                    <div className="flex items-center gap-3 h-11 px-4 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                      <Mail className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-400">{profile.email}</span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-1.5">Email cannot be changed</p>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile || !hasProfileChanges}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {savingProfile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Skills Card */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">My Skills & Equipment</h2>
                  {!profile.provider.workersCanEditSkills && (
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Set by admin</span>
                  )}
                </div>
                <div className="p-6">
                  {profile.provider.workersCanEditSkills ? (
                    <SkillsCheckboxPicker
                      workerId={profile.id}
                      workerSkills={workerSkills}
                      onSkillsChange={setWorkerSkills}
                      providerCategory={profile.provider.primaryCategory || undefined}
                      providerId={profile.provider.id}
                    />
                  ) : (
                    // Read-only view
                    profile.workerSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.workerSkills.map((ws) => (
                          <span
                            key={ws.skill.id}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full text-sm text-emerald-300 font-medium"
                          >
                            {ws.skill.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Award className="w-6 h-6 text-zinc-600" />
                        </div>
                        <p className="text-zinc-500 text-sm">Your admin will assign skills to you</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Account & Security Card */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="p-6 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-400" />
                    <h2 className="text-lg font-semibold text-white">Account & Security</h2>
                  </div>
                </div>
                <div className="divide-y divide-zinc-800">
                  <button
                    onClick={() => setPasswordModalOpen(true)}
                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center">
                        <Lock className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="text-white font-medium">Change Password</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center">
                        <Bell className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="text-white font-medium">Notifications</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  </button>

                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="text-white font-medium">Two-Factor Auth</span>
                    </div>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* Company Card */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="p-6 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Company</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                      {profile.provider.logoUrl ? (
                        <img src={profile.provider.logoUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Building className="w-6 h-6 text-zinc-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{profile.provider.businessName}</p>
                      <p className="text-zinc-500 text-sm">{profile.provider.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleContactOffice}
                    className="w-full h-11 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Contact Office
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-zinc-800 space-y-4">
            <button
              onClick={handleLogout}
              className="w-full h-12 border-2 border-red-500/50 hover:border-red-500 hover:bg-red-500/10 text-red-400 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>

            <button
              onClick={() => setDeleteAccountOpen(true)}
              className="w-full text-sm text-zinc-600 hover:text-red-400 transition-colors py-2"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Change Password Modal */}
        <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Change Password</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Enter your current password and choose a new one.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full h-11 px-4 pr-10 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full h-11 px-4 pr-10 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full h-11 px-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                />
                {passwordForm.newPassword && passwordForm.confirmPassword && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {passwordForm.newPassword === passwordForm.confirmPassword ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 h-11 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Account Confirmation */}
        <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
          <AlertDialogContent className="bg-zinc-900 border-zinc-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                Delete Account?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                This action cannot be undone. Please contact your administrator to delete your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toast.info('Please contact your administrator to delete your account.');
                  setDeleteAccountOpen(false);
                }}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                I Understand
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </WorkerLayout>
  );
}
