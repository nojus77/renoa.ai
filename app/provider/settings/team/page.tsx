'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import { Users, Plus, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import EnterpriseUpgradeModal from '@/components/provider/EnterpriseUpgradeModal';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  skills: string[];
}

interface SeatUsage {
  activeSeats: number;
  maxSeats: number;
  canAddSeats: boolean;
  isNearingLimit?: boolean;
  isAtLimit?: boolean;
}

export default function TeamSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState('');
  const [providerName, setProviderName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [seatUsage, setSeatUsage] = useState<SeatUsage | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');
    const role = localStorage.getItem('userRole');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    if (role !== 'owner') {
      toast.error('Only owners can manage team members');
      router.push('/provider/dashboard');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    setUserRole(role);

    fetchData(id);
  }, [router]);

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      // Fetch seat usage
      const seatRes = await fetch(`/api/provider/billing/seats?providerId=${id}`);
      const seatData = await seatRes.json();
      if (seatRes.ok) {
        setSeatUsage(seatData);
      }

      // Fetch team members
      const teamRes = await fetch(`/api/provider/team?providerId=${id}`);
      const teamData = await teamRes.json();
      if (teamRes.ok) {
        setTeamMembers(teamData.users || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    // Check if at enterprise limit
    if (!seatUsage?.canAddSeats) {
      setShowEnterpriseModal(true);
      return;
    }
    setShowInviteModal(true);
  };

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">Team Management</h1>
            <p className="text-zinc-400">Manage your team members and seats</p>
          </div>

          {/* Seat Usage Banner */}
          <div className="border rounded-xl p-6 mb-6 bg-zinc-900/50 border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">
                    {seatUsage?.activeSeats} Active Seats
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Add team members anytime - billed per active seat
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/provider/billing')}
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-800"
              >
                View Billing
              </Button>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Team Members</h2>
              <Button
                onClick={handleAddMember}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            {/* Active Members */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">Active Members</h3>
              {teamMembers.filter(m => m.status === 'active').map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-bold text-lg">
                      {member.firstName[0]}{member.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-zinc-400">{member.email}</p>
                      {member.skills.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {member.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 text-xs bg-zinc-700 text-zinc-300 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      member.role === 'owner' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      member.role === 'office' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {member.role}
                    </span>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${member.firstName} ${member.lastName} from the team?`)) {
                            toast.info('User removal coming soon!');
                          }
                        }}
                        className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Inactive Members */}
            {teamMembers.filter(m => m.status === 'inactive').length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-400 mb-3">Inactive Members</h3>
                {teamMembers.filter(m => m.status === 'inactive').map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-zinc-800/20 rounded-lg border border-zinc-800 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 font-bold text-lg">
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-300">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-zinc-500">{member.email}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-700 text-zinc-400">
                      Inactive
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enterprise Upgrade Modal */}
      <EnterpriseUpgradeModal
        isOpen={showEnterpriseModal}
        onClose={() => setShowEnterpriseModal(false)}
        businessName={providerName}
        currentSeats={seatUsage?.activeSeats || 0}
      />
    </ProviderLayout>
  );
}
