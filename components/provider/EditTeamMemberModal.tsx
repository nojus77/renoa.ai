'use client'

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Trash2, User, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import SkillsCheckboxPicker from './SkillsCheckboxPicker';
import ColorPicker from './ColorPicker';

interface WorkerSkill {
  id: string;
  skillId: string;
  level: string;
  skill: {
    id: string;
    name: string;
    category?: string | null;
  };
}

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  status: string;
  skills: string[];
  workerSkills?: WorkerSkill[];
  color?: string | null;
  hourlyRate?: number | null;
  payType?: string | null;
  commissionRate?: number | null;
  workingHours?: Record<string, { start: string; end: string }> | null;
  profilePhotoUrl?: string | null;
  createdAt: string;
}

interface EditTeamMemberModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedMember: any) => void;
  onDelete: (member: TeamMember) => void;
}

const ROLES = [
  { value: 'owner', label: 'Owner', description: 'Full access to all features' },
  { value: 'office', label: 'Office', description: 'Manage customers, jobs, invoices' },
  { value: 'field', label: 'Field Worker', description: 'View assigned jobs only' },
];

const STATUSES = [
  { value: 'active', label: 'Active', color: 'text-emerald-400' },
  { value: 'inactive', label: 'Inactive', color: 'text-zinc-400' },
  { value: 'on_leave', label: 'On Leave', color: 'text-yellow-400' },
];

export default function EditTeamMemberModal({
  member,
  isOpen,
  onClose,
  onSuccess,
  onDelete,
}: EditTeamMemberModalProps) {
  const [saving, setSaving] = useState(false);
  const [showDeactivateWarning, setShowDeactivateWarning] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [workerSkills, setWorkerSkills] = useState<WorkerSkill[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: 'field',
    status: 'active',
    color: '',
    hourlyRate: '',
    payType: 'hourly',
    commissionRate: '',
  });

  // Populate form when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        phone: member.phone || '',
        role: member.role || 'field',
        status: member.status || 'active',
        color: member.color || '',
        hourlyRate: member.hourlyRate ? String(member.hourlyRate) : '',
        payType: member.payType || 'hourly',
        commissionRate: member.commissionRate ? String(member.commissionRate) : '',
      });
      setWorkerSkills(member.workerSkills || []);
    }
  }, [member]);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.firstName.trim()) errors.push('First name is required');
    if (!formData.lastName.trim()) errors.push('Last name is required');
    if (!formData.role) errors.push('Role is required');

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone) {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length > 0 && digits.length !== 10) {
        errors.push('Phone number must be 10 digits');
      }
    }

    // Hourly rate validation
    if (formData.hourlyRate) {
      const rate = parseFloat(formData.hourlyRate);
      if (isNaN(rate) || rate < 0) {
        errors.push('Hourly rate must be a positive number');
      }
    }

    // Color validation
    if (formData.color && !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      errors.push('Color must be a valid hex code');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    if (!member) return;

    setSaving(true);
    try {
      const providerId = localStorage.getItem('providerId');
      const userId = localStorage.getItem('userId');

      if (!providerId || !userId) {
        toast.error('Not logged in');
        return;
      }

      const res = await fetch(`/api/provider/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          userId,
          changedBy: userId, // For audit logging
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone || null,
          role: formData.role,
          status: formData.status,
          color: formData.color || null,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
          payType: formData.payType || null,
          commissionRate: formData.commissionRate ? parseFloat(formData.commissionRate) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details && Array.isArray(data.details)) {
          data.details.forEach((err: string) => toast.error(err));
        } else {
          toast.error(data.error || 'Failed to update team member');
        }
        return;
      }

      toast.success('Team member updated');
      onSuccess(data.user || data);
      onClose();
    } catch (error) {
      toast.error('Unable to save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  if (!member) return null;

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const isEditingSelf = member.id === currentUserId;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 flex items-center gap-3">
            {member.profilePhotoUrl ? (
              <img
                src={member.profilePhotoUrl}
                alt={`${member.firstName} ${member.lastName}`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-400" />
              </div>
            )}
            Edit Team Member
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Update details for {member.firstName} {member.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Personal Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">
              Personal Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-zinc-200">
                  First Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100"
                  disabled={saving}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-zinc-200">
                  Last Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100"
                  disabled={saving}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-200">Email Address</Label>
              <Input
                id="email"
                value={member.email}
                className="bg-zinc-800/50 border-zinc-800 text-zinc-400"
                disabled
              />
              <p className="text-xs text-zinc-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-zinc-200">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                className="bg-zinc-900 border-zinc-800 text-zinc-100"
                disabled={saving}
              />
            </div>
          </div>

          {/* Role & Status Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">
              Role & Status
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-zinc-200">
                  Role <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  disabled={saving}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <span>{role.label}</span>
                          <span className="text-xs text-zinc-500 ml-2">- {role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-zinc-200">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => {
                    // Show warning when deactivating a user
                    if (value === 'inactive' && member?.status !== 'inactive') {
                      setPendingStatus(value);
                      setShowDeactivateWarning(true);
                    } else {
                      setFormData({ ...formData, status: value });
                    }
                  }}
                  disabled={saving || isEditingSelf}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className={status.color}>{status.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditingSelf && (
                  <p className="text-xs text-zinc-500">You cannot change your own status</p>
                )}
              </div>
            </div>
          </div>

          {/* Skills & Preferences Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">
              Skills & Preferences
            </h3>

            <div className="space-y-2">
              <Label className="text-zinc-200">Skills</Label>
              {member && (
                <SkillsCheckboxPicker
                  workerId={member.id}
                  workerSkills={workerSkills}
                  onSkillsChange={setWorkerSkills}
                  disabled={saving}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-200">Calendar Color</Label>
              <ColorPicker
                color={formData.color}
                onChange={(color) => setFormData({ ...formData, color })}
                disabled={saving}
              />
              <p className="text-xs text-zinc-500">Used to identify this person on the calendar</p>
            </div>

            {/* Pay Settings - Only show for field workers */}
            {formData.role === 'field' && (
              <div className="space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <h4 className="text-sm font-medium text-zinc-300">Pay Settings</h4>

                <div className="space-y-2">
                  <Label htmlFor="payType" className="text-zinc-200">Pay Type</Label>
                  <Select
                    value={formData.payType}
                    onValueChange={(value) => setFormData({ ...formData, payType: value })}
                    disabled={saving}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                      <SelectItem value="commission">Commission Per Job</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.payType === 'hourly' ? (
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate" className="text-zinc-200">Hourly Rate</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                      <Input
                        id="hourlyRate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        placeholder="0.00"
                        className="bg-zinc-900 border-zinc-800 text-zinc-100 pl-7"
                        disabled={saving}
                      />
                    </div>
                    <p className="text-xs text-zinc-500">Worker earns this per hour worked</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate" className="text-zinc-200">Commission Rate</Label>
                    <div className="relative">
                      <Input
                        id="commissionRate"
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={formData.commissionRate}
                        onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                        placeholder="50"
                        className="bg-zinc-900 border-zinc-800 text-zinc-100 pr-7"
                        disabled={saving}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
                    </div>
                    <p className="text-xs text-zinc-500">Worker earns this percentage of job value</p>
                  </div>
                )}
              </div>
            )}

            {/* Non-field worker hourly rate */}
            {formData.role !== 'field' && (
              <div className="space-y-2">
                <Label htmlFor="hourlyRate" className="text-zinc-200">Hourly Rate</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    placeholder="0.00"
                    className="bg-zinc-900 border-zinc-800 text-zinc-100 pl-7"
                    disabled={saving}
                  />
                </div>
                <p className="text-xs text-zinc-500">Used for job costing estimates</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onDelete(member)}
              disabled={saving || isEditingSelf}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isEditingSelf ? "Can't delete yourself" : 'Delete'}
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="border-zinc-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Deactivation Warning Dialog */}
      <AlertDialog open={showDeactivateWarning} onOpenChange={setShowDeactivateWarning}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Deactivate {member?.firstName}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 space-y-2">
              <p>
                This will <strong className="text-zinc-200">immediately log out {member?.firstName} {member?.lastName}</strong> and
                prevent them from accessing the app.
              </p>
              <p>
                They will see: &quot;Your account has been deactivated. Contact your employer.&quot;
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
              onClick={() => {
                setPendingStatus(null);
                setShowDeactivateWarning(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500"
              onClick={() => {
                if (pendingStatus) {
                  setFormData({ ...formData, status: pendingStatus });
                }
                setPendingStatus(null);
                setShowDeactivateWarning(false);
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
