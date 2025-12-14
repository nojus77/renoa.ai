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
  Crown,
  Users,
  Wrench,
  Plus,
  Pencil,
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

// Renoa Design System Colors
const COLORS = {
  sageGreen: '#C8D5B9',
  cream: '#F5F1E8',
  teal: '#1A5F4F',
  tealHover: '#164D40',
  tealLight: '#1A5F4F20',
};

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
  equipment?: string[];
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

interface CrewMember {
  id: string;
  name: string;
  profilePhotoUrl: string | null;
  role: string;
}

interface MyCrew {
  id: string;
  name: string;
  color: string;
  leader: {
    id: string;
    name: string;
    profilePhotoUrl: string | null;
  } | null;
  members: CrewMember[];
  memberCount: number;
}

// Common skills by category
const AVAILABLE_SKILLS: Record<string, string[]> = {
  'HVAC': ['AC Installation', 'AC Repair', 'Furnace Repair', 'Duct Cleaning', 'Heat Pump', 'Refrigerant Handling', 'Thermostat Install'],
  'Plumbing': ['Pipe Repair', 'Drain Cleaning', 'Water Heater', 'Fixture Install', 'Sewer Line', 'Leak Detection'],
  'Electrical': ['Wiring', 'Panel Upgrades', 'Lighting', 'Troubleshooting', 'Code Corrections', 'EV Charger'],
  'General': ['Customer Service', 'Heavy Lifting', 'Driving', 'Documentation', 'Safety Certified'],
};

// Common equipment items
const AVAILABLE_EQUIPMENT = [
  'Work Vehicle',
  'Basic Hand Tools',
  'Power Tools',
  'Multimeter',
  'Refrigerant Gauges',
  'Pipe Wrench Set',
  'Drain Snake',
  'Ladder (6ft)',
  'Ladder (Extension)',
  'Safety Gear',
  'Torch Kit',
  'Vacuum Pump',
];

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
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);

  // Equipment state
  const [equipment, setEquipment] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [savingEquipment, setSavingEquipment] = useState(false);
  const [customEquipment, setCustomEquipment] = useState('');

  // Crew state
  const [myCrew, setMyCrew] = useState<MyCrew | null>(null);

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
          setSelectedSkills(data.user.workerSkills.map((ws: Skill) => ws.skill.name));
        }

        // Initialize equipment
        if (data.user.equipment) {
          setEquipment(data.user.equipment);
          setSelectedEquipment(data.user.equipment);
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

    // Fetch crew data
    fetch(`/api/worker/my-crew?userId=${uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.crew) {
          setMyCrew(data.crew);
        }
      })
      .catch((err) => console.error('Error fetching crew:', err));
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

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      return;
    }

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
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handleSaveSkills = async () => {
    if (!profile) return;
    setSavingSkills(true);

    try {
      const res = await fetch('/api/worker/profile/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          skills: selectedSkills,
        }),
      });

      if (res.ok) {
        setProfile({ ...profile });
        toast.success('Skills updated!');
        setSkillsModalOpen(false);
      } else {
        toast.error('Failed to update skills');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSavingSkills(false);
    }
  };

  const handleSaveEquipment = async () => {
    if (!profile) return;
    setSavingEquipment(true);

    try {
      const res = await fetch('/api/worker/profile/equipment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          equipment: selectedEquipment,
        }),
      });

      if (res.ok) {
        setEquipment(selectedEquipment);
        setProfile({ ...profile, equipment: selectedEquipment });
        toast.success('Equipment updated!');
        setEquipmentModalOpen(false);
      } else {
        toast.error('Failed to update equipment');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSavingEquipment(false);
    }
  };

  const handleAddCustomEquipment = () => {
    if (customEquipment.trim() && !selectedEquipment.includes(customEquipment.trim())) {
      setSelectedEquipment([...selectedEquipment, customEquipment.trim()]);
      setCustomEquipment('');
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

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const toggleEquipment = (item: string) => {
    setSelectedEquipment(prev =>
      prev.includes(item)
        ? prev.filter(e => e !== item)
        : [...prev, item]
    );
  };

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: COLORS.cream }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.teal }} />
        </div>
      </WorkerLayout>
    );
  }

  if (!profile) {
    return (
      <WorkerLayout>
        <div className="p-4 text-center" style={{ backgroundColor: COLORS.cream }}>
          <p className="text-gray-600">Failed to load profile</p>
        </div>
      </WorkerLayout>
    );
  }

  const payInfo = getPayDisplay();

  return (
    <WorkerLayout>
      <div className="min-h-screen pb-28" style={{ backgroundColor: COLORS.cream }}>
        {/* Header Card with Sage Green Glow */}
        <div
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${COLORS.sageGreen} 0%, ${COLORS.cream} 100%)`,
          }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-60"
            style={{ backgroundColor: COLORS.sageGreen }}
          />

          <div className="relative px-4 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="relative group mb-4">
                <div
                  className="w-28 h-28 rounded-full bg-white border-4 flex items-center justify-center overflow-hidden shadow-lg"
                  style={{ borderColor: COLORS.teal }}
                >
                  {profile.profilePhotoUrl ? (
                    <img
                      src={profile.profilePhotoUrl}
                      alt={profile.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <label
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-lg cursor-pointer"
                  style={{ backgroundColor: COLORS.teal }}
                >
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

              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-gray-600 mb-3">
                Field Worker at <span style={{ color: COLORS.teal }} className="font-medium">Renoa</span>
              </p>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                  profile.status === 'active'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${profile.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                {profile.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-4 -mt-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-[20px] p-4 shadow-sm">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg mb-3 mx-auto"
                style={{ backgroundColor: `${COLORS.teal}15` }}
              >
                <Briefcase className="w-5 h-5" style={{ color: COLORS.teal }} />
              </div>
              <p className="text-2xl font-bold text-gray-900 text-center">{jobsThisWeek}</p>
              <p className="text-xs text-gray-500 text-center">Jobs this week</p>
            </div>

            <div className="bg-white rounded-[20px] p-4 shadow-sm">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg mb-3 mx-auto"
                style={{ backgroundColor: `${COLORS.teal}15` }}
              >
                <DollarSign className="w-5 h-5" style={{ color: COLORS.teal }} />
              </div>
              <p className="text-2xl font-bold text-gray-900 text-center">{payInfo.value}</p>
              <p className="text-xs text-gray-500 text-center">{payInfo.subtitle || 'Pay rate'}</p>
            </div>

            <div className="bg-white rounded-[20px] p-4 shadow-sm">
              <div className="flex items-center justify-center w-10 h-10 bg-yellow-50 rounded-lg mb-3 mx-auto">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 text-center">--</p>
              <p className="text-xs text-gray-500 text-center">No reviews yet</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Personal Information Card */}
              <div className="bg-white rounded-[20px] shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">First Name</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: formatPhoneNumber(e.target.value) })}
                      placeholder="(555) 123-4567"
                      className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
                    <div className="flex items-center gap-3 h-11 px-4 bg-gray-100 border border-gray-200 rounded-xl">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">{profile.email}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">Email cannot be changed</p>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile || !hasProfileChanges}
                    className="w-full h-11 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    style={{ backgroundColor: hasProfileChanges ? COLORS.teal : undefined }}
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

              {/* My Skills Card */}
              <div className="bg-white rounded-[20px] shadow-sm">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5" style={{ color: COLORS.teal }} />
                    <h2 className="text-lg font-semibold text-gray-900">My Skills</h2>
                  </div>
                  <button
                    onClick={() => setSkillsModalOpen(true)}
                    className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: COLORS.teal, backgroundColor: `${COLORS.teal}10` }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
                <div className="p-6">
                  {selectedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: `${COLORS.teal}15`,
                            color: COLORS.teal,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Award className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">No skills added yet</p>
                      <button
                        onClick={() => setSkillsModalOpen(true)}
                        className="mt-3 text-sm font-medium"
                        style={{ color: COLORS.teal }}
                      >
                        + Add your skills
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Equipment Card */}
              <div className="bg-white rounded-[20px] shadow-sm">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" style={{ color: COLORS.teal }} />
                    <h2 className="text-lg font-semibold text-gray-900">Equipment</h2>
                  </div>
                  <button
                    onClick={() => setEquipmentModalOpen(true)}
                    className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: COLORS.teal, backgroundColor: `${COLORS.teal}10` }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
                <div className="p-6">
                  {equipment.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {equipment.map((item) => (
                        <span
                          key={item}
                          className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Wrench className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">No equipment listed</p>
                      <button
                        onClick={() => setEquipmentModalOpen(true)}
                        className="mt-3 text-sm font-medium"
                        style={{ color: COLORS.teal }}
                      >
                        + Add your equipment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Account & Security Card */}
              <div className="bg-white rounded-[20px] shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Account & Security</h2>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  <button
                    onClick={() => setPasswordModalOpen(true)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Lock className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="text-gray-900 font-medium">Change Password</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Bell className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="text-gray-900 font-medium">Notifications</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="text-gray-900 font-medium">Two-Factor Auth</span>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* My Crew Card */}
              <div className="bg-white rounded-[20px] shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-600" />
                    <h2 className="text-lg font-semibold text-gray-900">My Crew</h2>
                  </div>
                </div>
                <div className="p-6">
                  {myCrew ? (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: myCrew.color }}
                        />
                        <h3 className="font-semibold text-gray-900">{myCrew.name}</h3>
                        <span className="text-gray-500 text-sm">
                          ({myCrew.memberCount} {myCrew.memberCount === 1 ? 'member' : 'members'})
                        </span>
                      </div>

                      {myCrew.leader && (
                        <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                          <Crown className="w-4 h-4 text-yellow-500" />
                          <span className="text-gray-500 text-sm">Leader:</span>
                          <div className="flex items-center gap-2">
                            {myCrew.leader.profilePhotoUrl ? (
                              <img
                                src={myCrew.leader.profilePhotoUrl}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                            <span className="text-gray-900 font-medium text-sm">{myCrew.leader.name}</span>
                          </div>
                        </div>
                      )}

                      {myCrew.members.length > 0 && (
                        <div>
                          <span className="text-gray-500 text-sm block mb-2">Crewmates:</span>
                          <div className="space-y-2">
                            {myCrew.members.map((member) => (
                              <div key={member.id} className="flex items-center gap-2">
                                {member.profilePhotoUrl ? (
                                  <img
                                    src={member.profilePhotoUrl}
                                    alt=""
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                                <span className="text-gray-900 text-sm">{member.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">You&apos;re not assigned to a crew</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Card */}
              <div className="bg-white rounded-[20px] shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-purple-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Company</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${COLORS.teal}15` }}
                    >
                      {profile.provider.logoUrl ? (
                        <img src={profile.provider.logoUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-xl font-bold" style={{ color: COLORS.teal }}>R</span>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold">Renoa</p>
                      <p className="text-gray-500 text-sm">{profile.provider.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleContactOffice}
                    className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Contact Office
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-gray-200 space-y-4">
            <button
              onClick={handleLogout}
              className="w-full h-12 border-2 border-red-300 hover:border-red-400 hover:bg-red-50 text-red-500 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>

            <button
              onClick={() => setDeleteAccountOpen(true)}
              className="w-full text-sm text-gray-400 hover:text-red-500 transition-colors py-2"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Skills Edit Modal */}
        <Dialog open={skillsModalOpen} onOpenChange={setSkillsModalOpen}>
          <DialogContent className="bg-white border-gray-200 max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Edit Skills</DialogTitle>
              <DialogDescription className="text-gray-500">
                Select the skills you have to help match you with the right jobs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {Object.entries(AVAILABLE_SKILLS).map(([category, skills]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedSkills.includes(skill)
                            ? 'text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        style={selectedSkills.includes(skill) ? { backgroundColor: COLORS.teal } : undefined}
                      >
                        {selectedSkills.includes(skill) && <Check className="w-3 h-3 inline mr-1" />}
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSkillsModalOpen(false)}
                  className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSkills}
                  disabled={savingSkills}
                  className="flex-1 h-11 text-white font-medium rounded-xl transition-colors flex items-center justify-center"
                  style={{ backgroundColor: COLORS.teal }}
                >
                  {savingSkills ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Skills'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Equipment Edit Modal */}
        <Dialog open={equipmentModalOpen} onOpenChange={setEquipmentModalOpen}>
          <DialogContent className="bg-white border-gray-200 max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Edit Equipment</DialogTitle>
              <DialogDescription className="text-gray-500">
                Select the equipment you have available for jobs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_EQUIPMENT.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleEquipment(item)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedEquipment.includes(item)
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={selectedEquipment.includes(item) ? { backgroundColor: COLORS.teal } : undefined}
                  >
                    {selectedEquipment.includes(item) && <Check className="w-3 h-3 inline mr-1" />}
                    {item}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-600 mb-2">Add Custom Equipment</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customEquipment}
                    onChange={(e) => setCustomEquipment(e.target.value)}
                    placeholder="e.g., Specialized tool..."
                    className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomEquipment()}
                  />
                  <button
                    onClick={handleAddCustomEquipment}
                    disabled={!customEquipment.trim()}
                    className="h-10 px-4 text-white font-medium rounded-lg disabled:bg-gray-300"
                    style={{ backgroundColor: customEquipment.trim() ? COLORS.teal : undefined }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {selectedEquipment.filter(item => !AVAILABLE_EQUIPMENT.includes(item)).length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-2">Custom items:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEquipment.filter(item => !AVAILABLE_EQUIPMENT.includes(item)).map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: COLORS.teal }}
                      >
                        {item}
                        <button
                          onClick={() => toggleEquipment(item)}
                          className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setEquipmentModalOpen(false)}
                  className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEquipment}
                  disabled={savingEquipment}
                  className="flex-1 h-11 text-white font-medium rounded-xl transition-colors flex items-center justify-center"
                  style={{ backgroundColor: COLORS.teal }}
                >
                  {savingEquipment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Equipment'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Change Password Modal */}
        <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
          <DialogContent className="bg-white border-gray-200 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Change Password</DialogTitle>
              <DialogDescription className="text-gray-500">
                Enter your current password and choose a new one.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full h-11 px-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full h-11 px-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-teal-500 focus:outline-none"
                />
                {passwordForm.newPassword && passwordForm.confirmPassword && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {passwordForm.newPassword === passwordForm.confirmPassword ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-500">Passwords do not match</span>
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
                  className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="flex-1 h-11 text-white font-medium rounded-xl transition-colors flex items-center justify-center disabled:bg-gray-300"
                  style={{ backgroundColor: !savingPassword && passwordForm.currentPassword && passwordForm.newPassword && passwordForm.newPassword === passwordForm.confirmPassword ? COLORS.teal : undefined }}
                >
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Account Confirmation */}
        <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
          <AlertDialogContent className="bg-white border-gray-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Delete Account?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500">
                This action cannot be undone. Please contact your administrator to delete your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toast.info('Please contact your administrator to delete your account.');
                  setDeleteAccountOpen(false);
                }}
                className="bg-red-500 hover:bg-red-600 text-white"
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
