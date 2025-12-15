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
  Sun,
  Moon,
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

// Renoa Design System - Black + Lime Green Theme
const LIME_GREEN = '#C4F542';

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

// Skills organized by company category - filter shown based on company type
const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  'HVAC': ['AC Installation', 'AC Repair', 'Furnace Repair', 'Duct Cleaning', 'Heat Pump', 'Refrigerant Handling', 'Thermostat Install', 'Air Quality', 'Maintenance Plans', 'Heating Repair'],
  'Plumbing': ['Pipe Repair', 'Drain Cleaning', 'Water Heater', 'Fixture Install', 'Sewer Line', 'Leak Detection', 'Garbage Disposal', 'Bathroom Remodel', 'Water Filtration'],
  'Electrical': ['Wiring', 'Panel Upgrades', 'Lighting', 'Troubleshooting', 'Code Corrections', 'EV Charger', 'Outlet Installation', 'Ceiling Fans', 'Generator Installation'],
  'Roofing': ['Shingle Repair', 'Roof Replacement', 'Gutter Install', 'Gutter Cleaning', 'Roof Inspection', 'Leak Repair', 'Flat Roof', 'Metal Roofing', 'Skylight Install'],
  'Painting': ['Interior Painting', 'Exterior Painting', 'Cabinet Painting', 'Deck Staining', 'Wallpaper', 'Pressure Washing', 'Drywall Repair', 'Color Consulting'],
  'Landscaping & Lawn Care': ['Lawn Mowing', 'Leaf Removal', 'Tree Trimming', 'Landscape Design', 'Irrigation', 'Fertilization', 'Mulching', 'Snow Removal', 'Hedge Trimming'],
  'Home Remodeling': ['Kitchen Remodel', 'Bathroom Remodel', 'Basement Finishing', 'Room Additions', 'Flooring', 'Tile Work', 'Custom Carpentry', 'Deck Building'],
  'Fencing': ['Wood Fence', 'Vinyl Fence', 'Chain Link', 'Iron/Metal Fence', 'Gate Installation', 'Fence Repair', 'Privacy Fence'],
  'Flooring': ['Hardwood Install', 'Laminate', 'Tile', 'Carpet', 'Vinyl/LVP', 'Floor Refinishing', 'Subfloor Repair'],
  'Cleaning Services': ['Regular Cleaning', 'Deep Cleaning', 'Move-in/Move-out', 'Window Cleaning', 'Carpet Cleaning', 'Pressure Washing', 'Post-Construction'],
  'General Contracting': ['Project Management', 'Permit Handling', 'Full Renovations', 'New Construction', 'Commercial Build-out'],
  'General': ['Customer Service', 'Heavy Lifting', 'Driving', 'Documentation', 'Safety Certified'],
};

// Function to get skills filtered by company category
const getFilteredSkills = (companyCategory: string | null | undefined): Record<string, string[]> => {
  // Always include General skills
  const result: Record<string, string[]> = {
    'General': SKILLS_BY_CATEGORY['General'],
  };

  // If no category, return all skills
  if (!companyCategory) {
    return SKILLS_BY_CATEGORY;
  }

  // Find matching category (case-insensitive partial match)
  const normalizedCategory = companyCategory.toLowerCase();

  for (const [category, skills] of Object.entries(SKILLS_BY_CATEGORY)) {
    if (category === 'General') continue; // Already added

    const normalizedCat = category.toLowerCase();
    // Match if category contains the company type or vice versa
    if (normalizedCat.includes(normalizedCategory) || normalizedCategory.includes(normalizedCat)) {
      result[category] = skills;
    }
  }

  // If only General was found, show all skills (fallback)
  if (Object.keys(result).length === 1) {
    return SKILLS_BY_CATEGORY;
  }

  return result;
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

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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

    // Load saved theme preference
    const savedTheme = localStorage.getItem('workerTheme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, [router, fetchProfile]);

  // Apply theme to document
  const applyTheme = (newTheme: 'dark' | 'light') => {
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('workerTheme', newTheme);
    applyTheme(newTheme);
    toast.success(`${newTheme === 'light' ? 'Light' : 'Dark'} mode enabled`);
  };

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
        <div className="flex items-center justify-center min-h-screen bg-black">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: LIME_GREEN }} />
        </div>
      </WorkerLayout>
    );
  }

  if (!profile) {
    return (
      <WorkerLayout>
        <div className="p-4 text-center bg-black min-h-screen">
          <p className="text-zinc-400">Failed to load profile</p>
        </div>
      </WorkerLayout>
    );
  }

  const payInfo = getPayDisplay();

  return (
    <WorkerLayout>
      <div className="min-h-screen bg-black">
        {/* Header Section - Clean, no glow */}
        <div className="bg-[#1F1F1F] px-4 py-8">
          <div className="flex flex-col items-center text-center">
            {/* Profile Photo */}
            <div className="relative group mb-4">
              <div
                className="w-28 h-28 rounded-full bg-zinc-800 border-4 flex items-center justify-center overflow-hidden shadow-lg"
                style={{ borderColor: LIME_GREEN }}
              >
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
              <label
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-lg cursor-pointer"
                style={{ backgroundColor: LIME_GREEN }}
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-4 h-4 text-black animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-black" />
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
              Field Worker at <span style={{ color: LIME_GREEN }} className="font-medium">Renoa</span>
            </p>

            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                profile.status === 'active'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${profile.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
              {profile.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-4 pt-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Jobs This Week */}
            <div className="bg-[#1F1F1F] rounded-[20px] p-4 border border-[#2A2A2A]">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg mb-3 mx-auto"
                style={{ backgroundColor: `${LIME_GREEN}20` }}
              >
                <Briefcase className="w-5 h-5" style={{ color: LIME_GREEN }} />
              </div>
              <p className="text-2xl font-bold text-white text-center">{jobsThisWeek}</p>
              <p className="text-xs text-zinc-500 text-center">Jobs this week</p>
            </div>

            {/* Pay Rate */}
            <div className="bg-[#1F1F1F] rounded-[20px] p-4 border border-[#2A2A2A]">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg mb-3 mx-auto"
                style={{ backgroundColor: `${LIME_GREEN}20` }}
              >
                <DollarSign className="w-5 h-5" style={{ color: LIME_GREEN }} />
              </div>
              <p className="text-2xl font-bold text-white text-center">{payInfo.value}</p>
              <p className="text-xs text-zinc-500 text-center">{payInfo.subtitle || 'Pay rate'}</p>
            </div>

            {/* Rating */}
            <div className="bg-[#1F1F1F] rounded-[20px] p-4 border border-[#2A2A2A]">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg mb-3 mx-auto"
                style={{ backgroundColor: `${LIME_GREEN}20` }}
              >
                <Star className="w-5 h-5" style={{ color: LIME_GREEN }} />
              </div>
              <p className="text-2xl font-bold text-white text-center">--</p>
              <p className="text-xs text-zinc-500 text-center">No reviews yet</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Personal Information Card */}
              <div className="bg-[#1F1F1F] rounded-[20px] border border-[#2A2A2A]">
                <div className="p-6 border-b border-[#2A2A2A]">
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
                        className="w-full h-11 px-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-[#C4F542] focus:ring-1 focus:ring-[#C4F542] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="w-full h-11 px-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-[#C4F542] focus:ring-1 focus:ring-[#C4F542] focus:outline-none transition-colors"
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
                      className="w-full h-11 px-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 focus:border-[#C4F542] focus:ring-1 focus:ring-[#C4F542] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Email Address</label>
                    <div className="flex items-center gap-3 h-11 px-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
                      <Mail className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-400">{profile.email}</span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-1.5">Email cannot be changed</p>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile || !hasProfileChanges}
                    className="w-full h-11 text-black font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
                    style={{ backgroundColor: hasProfileChanges ? LIME_GREEN : undefined }}
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
              <div className="bg-[#1F1F1F] rounded-[20px] border border-[#2A2A2A]">
                <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5" style={{ color: LIME_GREEN }} />
                    <h2 className="text-lg font-semibold text-white">My Skills</h2>
                  </div>
                  <button
                    onClick={() => setSkillsModalOpen(true)}
                    className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: LIME_GREEN, backgroundColor: `${LIME_GREEN}15` }}
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
                          className="px-3 py-1.5 rounded-full text-sm font-medium text-black"
                          style={{ backgroundColor: LIME_GREEN }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Award className="w-6 h-6 text-zinc-600" />
                      </div>
                      <p className="text-zinc-500 text-sm">No skills added yet</p>
                      <button
                        onClick={() => setSkillsModalOpen(true)}
                        className="mt-3 text-sm font-medium"
                        style={{ color: LIME_GREEN }}
                      >
                        + Add your skills
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Equipment Card */}
              <div className="bg-[#1F1F1F] rounded-[20px] border border-[#2A2A2A]">
                <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" style={{ color: LIME_GREEN }} />
                    <h2 className="text-lg font-semibold text-white">Equipment</h2>
                  </div>
                  <button
                    onClick={() => setEquipmentModalOpen(true)}
                    className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: LIME_GREEN, backgroundColor: `${LIME_GREEN}15` }}
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
                          className="px-3 py-1.5 bg-zinc-800 rounded-full text-sm text-zinc-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Wrench className="w-6 h-6 text-zinc-600" />
                      </div>
                      <p className="text-zinc-500 text-sm">No equipment listed</p>
                      <button
                        onClick={() => setEquipmentModalOpen(true)}
                        className="mt-3 text-sm font-medium"
                        style={{ color: LIME_GREEN }}
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
              <div className="bg-[#1F1F1F] rounded-[20px] border border-[#2A2A2A]">
                <div className="p-6 border-b border-[#2A2A2A]">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" style={{ color: LIME_GREEN }} />
                    <h2 className="text-lg font-semibold text-white">Account & Security</h2>
                  </div>
                </div>
                <div className="divide-y divide-[#2A2A2A]">
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

                  <button
                    onClick={() => {
                      toast.info('Notification settings coming soon!');
                    }}
                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center">
                        <Bell className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="text-white font-medium">Notifications</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  </button>

                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center">
                        {theme === 'dark' ? (
                          <Moon className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <Sun className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <span className="text-white font-medium">Appearance</span>
                        <p className="text-xs text-zinc-500">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        theme === 'light' ? 'bg-[#C4F542]' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                          theme === 'light' ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

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

              {/* My Crew Card */}
              <div className="bg-[#1F1F1F] rounded-[20px] border border-[#2A2A2A]">
                <div className="p-6 border-b border-[#2A2A2A]">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" style={{ color: LIME_GREEN }} />
                    <h2 className="text-lg font-semibold text-white">My Crew</h2>
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
                        <h3 className="font-semibold text-white">{myCrew.name}</h3>
                        <span className="text-zinc-500 text-sm">
                          ({myCrew.memberCount} {myCrew.memberCount === 1 ? 'member' : 'members'})
                        </span>
                      </div>

                      {myCrew.leader && (
                        <div className="flex items-center gap-2 mb-4 p-3 bg-zinc-800/50 rounded-lg">
                          <Crown className="w-4 h-4 text-yellow-500" />
                          <span className="text-zinc-400 text-sm">Leader:</span>
                          <div className="flex items-center gap-2">
                            {myCrew.leader.profilePhotoUrl ? (
                              <img
                                src={myCrew.leader.profilePhotoUrl}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-zinc-500" />
                              </div>
                            )}
                            <span className="text-white font-medium text-sm">{myCrew.leader.name}</span>
                          </div>
                        </div>
                      )}

                      {myCrew.members.length > 0 && (
                        <div>
                          <span className="text-zinc-500 text-sm block mb-2">Crewmates:</span>
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
                                  <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-zinc-500" />
                                  </div>
                                )}
                                <span className="text-white text-sm">{member.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">You&apos;re not assigned to a crew</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Card */}
              <div className="bg-[#1F1F1F] rounded-[20px] border border-[#2A2A2A]">
                <div className="p-6 border-b border-[#2A2A2A]">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5" style={{ color: LIME_GREEN }} />
                    <h2 className="text-lg font-semibold text-white">Company</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${LIME_GREEN}20` }}
                    >
                      {profile.provider.logoUrl ? (
                        <img src={profile.provider.logoUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-xl font-bold" style={{ color: LIME_GREEN }}>R</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">Renoa</p>
                      <p className="text-zinc-500 text-sm">{profile.provider.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleContactOffice}
                    className="w-full h-11 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Contact Office
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 pb-6 border-t border-zinc-800 space-y-4">
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

        {/* Skills Edit Modal - Filtered by company category */}
        <Dialog open={skillsModalOpen} onOpenChange={setSkillsModalOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Skills</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Select the skills you have to help match you with the right jobs.
                {profile.provider.primaryCategory && (
                  <span className="block mt-1 text-xs" style={{ color: LIME_GREEN }}>
                    Showing skills for: {profile.provider.primaryCategory}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {Object.entries(getFilteredSkills(profile.provider.primaryCategory)).map(([category, skills]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedSkills.includes(skill)
                            ? 'text-black'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                        style={selectedSkills.includes(skill) ? { backgroundColor: LIME_GREEN } : undefined}
                      >
                        {selectedSkills.includes(skill) && <Check className="w-3 h-3 inline mr-1" />}
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setSkillsModalOpen(false)}
                  className="flex-1 h-11 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSkills}
                  disabled={savingSkills}
                  className="flex-1 h-11 text-black font-medium rounded-xl transition-colors flex items-center justify-center"
                  style={{ backgroundColor: LIME_GREEN }}
                >
                  {savingSkills ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Skills'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Equipment Edit Modal */}
        <Dialog open={equipmentModalOpen} onOpenChange={setEquipmentModalOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Equipment</DialogTitle>
              <DialogDescription className="text-zinc-400">
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
                        ? 'text-black'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                    style={selectedEquipment.includes(item) ? { backgroundColor: LIME_GREEN } : undefined}
                  >
                    {selectedEquipment.includes(item) && <Check className="w-3 h-3 inline mr-1" />}
                    {item}
                  </button>
                ))}
              </div>

              {/* Custom Equipment */}
              <div className="pt-4 border-t border-zinc-800">
                <label className="block text-sm font-medium text-zinc-400 mb-2">Add Custom Equipment</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customEquipment}
                    onChange={(e) => setCustomEquipment(e.target.value)}
                    placeholder="e.g., Specialized tool..."
                    className="flex-1 h-10 px-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-[#C4F542]"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomEquipment()}
                  />
                  <button
                    onClick={handleAddCustomEquipment}
                    disabled={!customEquipment.trim()}
                    className="h-10 px-4 text-black font-medium rounded-lg disabled:bg-zinc-800 disabled:text-zinc-600"
                    style={{ backgroundColor: customEquipment.trim() ? LIME_GREEN : undefined }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Selected custom items */}
              {selectedEquipment.filter(item => !AVAILABLE_EQUIPMENT.includes(item)).length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-zinc-500 mb-2">Custom items:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEquipment.filter(item => !AVAILABLE_EQUIPMENT.includes(item)).map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-black"
                        style={{ backgroundColor: LIME_GREEN }}
                      >
                        {item}
                        <button
                          onClick={() => toggleEquipment(item)}
                          className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setEquipmentModalOpen(false)}
                  className="flex-1 h-11 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEquipment}
                  disabled={savingEquipment}
                  className="flex-1 h-11 text-black font-medium rounded-xl transition-colors flex items-center justify-center"
                  style={{ backgroundColor: LIME_GREEN }}
                >
                  {savingEquipment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Equipment'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                    className="w-full h-11 px-4 pr-10 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-[#C4F542] focus:outline-none"
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
                    className="w-full h-11 px-4 pr-10 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-[#C4F542] focus:outline-none"
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
                  className="w-full h-11 px-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-[#C4F542] focus:outline-none"
                />
                {passwordForm.newPassword && passwordForm.confirmPassword && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {passwordForm.newPassword === passwordForm.confirmPassword ? (
                      <>
                        <Check className="w-4 h-4" style={{ color: LIME_GREEN }} />
                        <span className="text-sm" style={{ color: LIME_GREEN }}>Passwords match</span>
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
                  className="flex-1 h-11 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="flex-1 h-11 text-black font-medium rounded-xl transition-colors flex items-center justify-center disabled:bg-zinc-800 disabled:text-zinc-600"
                  style={{ backgroundColor: !savingPassword && passwordForm.currentPassword && passwordForm.newPassword && passwordForm.newPassword === passwordForm.confirmPassword ? LIME_GREEN : undefined }}
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
