'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle,
  Plus,
  XCircle,
  Loader2,
  User,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface SkillMismatch {
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
}

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  color?: string;
  skillIds?: string[];
  skills?: string[];
}

interface Skill {
  id: string;
  name: string;
}

interface SkillMismatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  mismatches: SkillMismatch[];
  workers: Worker[];
  providerId: string;
  onUpdate: () => void;
  onMismatchesChange: (mismatches: SkillMismatch[]) => void;
}

export default function SkillMismatchModal({
  isOpen,
  onClose,
  mismatches,
  workers,
  providerId,
  onUpdate,
  onMismatchesChange,
}: SkillMismatchModalProps) {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [skillsToAdd, setSkillsToAdd] = useState<Record<string, string[]>>({});
  const [overrideReason, setOverrideReason] = useState<Record<string, string>>({});
  const [showOverride, setShowOverride] = useState<Record<string, boolean>>({});
  const [qualifiedWorkers, setQualifiedWorkers] = useState<Record<string, Worker[]>>({});
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);

  // Fetch available skills for the provider
  useEffect(() => {
    if (isOpen && providerId) {
      fetchAvailableSkills();
    }
  }, [isOpen, providerId]);

  // Calculate qualified workers for each mismatch
  useEffect(() => {
    if (mismatches.length > 0 && workers.length > 0) {
      const qualified: Record<string, Worker[]> = {};

      for (const mismatch of mismatches) {
        // Find workers who have ALL required skills
        const workersWithSkills = workers.filter(w => {
          if (w.id === mismatch.assignedWorkerId) return false; // Exclude current worker

          const workerSkillIds = w.skillIds || [];
          const requiredSkillIds = mismatch.requiredSkillIds || [];

          if (requiredSkillIds.length === 0) return false;

          // Worker must have ALL required skills
          return requiredSkillIds.every(skillId => workerSkillIds.includes(skillId));
        });

        qualified[mismatch.jobId] = workersWithSkills;
      }

      setQualifiedWorkers(qualified);
    }
  }, [mismatches, workers]);

  const fetchAvailableSkills = async () => {
    try {
      const res = await fetch(`/api/provider/skills?providerId=${providerId}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSkills(data);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const toggleSkillToAdd = (mismatchJobId: string, workerId: string, skillId: string) => {
    const key = `${mismatchJobId}-${workerId}`;
    setSkillsToAdd(prev => {
      const current = prev[key] || [];
      if (current.includes(skillId)) {
        return { ...prev, [key]: current.filter(s => s !== skillId) };
      }
      return { ...prev, [key]: [...current, skillId] };
    });
  };

  const handleQuickAddSkills = async (mismatch: SkillMismatch) => {
    const key = `${mismatch.jobId}-${mismatch.assignedWorkerId}`;
    const skillIds = skillsToAdd[key] || [];

    if (skillIds.length === 0) {
      toast.error('Select at least one skill to add');
      return;
    }

    setLoading(prev => ({ ...prev, [mismatch.jobId]: true }));

    try {
      // Add each skill to the worker
      for (const skillId of skillIds) {
        const res = await fetch(`/api/provider/team/${mismatch.assignedWorkerId}/skills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skillId,
            level: 'basic',
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to add skill');
        }
      }

      toast.success(`Added ${skillIds.length} skill(s) to ${mismatch.assignedWorkerName}`);

      // Remove this mismatch from the list
      onMismatchesChange(mismatches.filter(m => m.jobId !== mismatch.jobId));

      // Clear selections
      setSkillsToAdd(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });

      onUpdate();
    } catch (error: any) {
      console.error('Error adding skills:', error);
      toast.error(error.message || 'Failed to add skills');
    } finally {
      setLoading(prev => ({ ...prev, [mismatch.jobId]: false }));
    }
  };

  const handleReassign = async (mismatch: SkillMismatch, newWorkerId: string) => {
    setLoading(prev => ({ ...prev, [mismatch.jobId]: true }));

    try {
      const res = await fetch(`/api/provider/jobs/${mismatch.jobId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          userIds: [newWorkerId],
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reassign job');
      }

      const newWorker = workers.find(w => w.id === newWorkerId);
      toast.success(`Reassigned to ${newWorker?.firstName || 'worker'}`);

      // Remove this mismatch from the list
      onMismatchesChange(mismatches.filter(m => m.jobId !== mismatch.jobId));

      onUpdate();
    } catch (error: any) {
      console.error('Error reassigning job:', error);
      toast.error(error.message || 'Failed to reassign job');
    } finally {
      setLoading(prev => ({ ...prev, [mismatch.jobId]: false }));
    }
  };

  const handleOverride = async (mismatch: SkillMismatch) => {
    const reason = overrideReason[mismatch.jobId]?.trim();

    if (!reason) {
      toast.error('Please provide a reason for the override');
      return;
    }

    setLoading(prev => ({ ...prev, [mismatch.jobId]: true }));

    try {
      const res = await fetch(`/api/provider/jobs/${mismatch.jobId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          reason,
          assignedWorkerId: mismatch.assignedWorkerId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to apply override');
      }

      toast.success('Skill override applied');

      // Remove this mismatch from the list
      onMismatchesChange(mismatches.filter(m => m.jobId !== mismatch.jobId));

      // Clear state
      setShowOverride(prev => ({ ...prev, [mismatch.jobId]: false }));
      setOverrideReason(prev => {
        const updated = { ...prev };
        delete updated[mismatch.jobId];
        return updated;
      });

      onUpdate();
    } catch (error: any) {
      console.error('Error applying override:', error);
      toast.error(error.message || 'Failed to apply override');
    } finally {
      setLoading(prev => ({ ...prev, [mismatch.jobId]: false }));
    }
  };

  const getSkillName = (skillId: string) => {
    const skill = availableSkills.find(s => s.id === skillId);
    return skill?.name || skillId;
  };

  if (mismatches.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Skill Mismatches Found ({mismatches.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            These jobs are assigned to workers missing required skills. Choose how to resolve each:
          </p>

          {mismatches.map((mismatch) => {
            const qualified = qualifiedWorkers[mismatch.jobId] || [];
            const key = `${mismatch.jobId}-${mismatch.assignedWorkerId}`;
            const selectedSkills = skillsToAdd[key] || [];
            const isLoading = loading[mismatch.jobId];
            const isShowingOverride = showOverride[mismatch.jobId];

            return (
              <div
                key={mismatch.jobId}
                className="p-4 border border-amber-500/30 bg-amber-500/5 rounded-lg space-y-4"
              >
                {/* Job Info */}
                <div>
                  <p className="font-medium text-foreground">{mismatch.jobTitle}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Currently assigned: <span className="text-amber-600 font-medium">{mismatch.assignedWorkerName}</span>
                  </p>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-amber-600 font-medium">Missing skills: </span>
                    <span className="text-foreground">
                      {mismatch.missingSkillNames.length > 0
                        ? mismatch.missingSkillNames.join(', ')
                        : mismatch.requiredSkills.join(', ') || 'Required skills not configured'}
                    </span>
                  </div>
                </div>

                {/* Option 1: Qualified Workers (if any) */}
                {qualified.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Qualified Workers Available
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {qualified.map(worker => (
                        <Button
                          key={worker.id}
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleReassign(mismatch, worker.id)}
                          className="flex items-center gap-2"
                          style={{
                            borderColor: worker.color || '#10b981',
                            color: worker.color || '#10b981',
                          }}
                        >
                          <CheckCircle className="w-3 h-3" />
                          {worker.firstName} {worker.lastName}
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Option 2: Quick-Add Skills */}
                {mismatch.missingSkillIds.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Quick-Add Skills to {mismatch.assignedWorkerName.split(' ')[0]}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {mismatch.missingSkillIds.map(skillId => {
                        const skillName = getSkillName(skillId);
                        const isSelected = selectedSkills.includes(skillId);
                        return (
                          <button
                            key={skillId}
                            onClick={() => toggleSkillToAdd(mismatch.jobId, mismatch.assignedWorkerId, skillId)}
                            disabled={isLoading}
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
                              isSelected
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-background border-border hover:border-emerald-500 hover:text-emerald-600'
                            }`}
                          >
                            {isSelected ? <CheckCircle className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            {skillName}
                          </button>
                        );
                      })}
                    </div>
                    {selectedSkills.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleQuickAddSkills(mismatch)}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Add {selectedSkills.length} Skill{selectedSkills.length > 1 ? 's' : ''} & Resolve
                      </Button>
                    )}
                  </div>
                )}

                {/* Option 3: Override */}
                {!isShowingOverride ? (
                  <button
                    onClick={() => setShowOverride(prev => ({ ...prev, [mismatch.jobId]: true }))}
                    className="text-xs text-muted-foreground hover:text-amber-600 flex items-center gap-1"
                  >
                    <Shield className="w-3 h-3" />
                    Override skill requirement...
                  </button>
                ) : (
                  <div className="space-y-2 p-3 bg-amber-500/10 rounded border border-amber-500/30">
                    <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Override Skill Requirement
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This will be logged for compliance. Provide a reason:
                    </p>
                    <textarea
                      value={overrideReason[mismatch.jobId] || ''}
                      onChange={(e) => setOverrideReason(prev => ({
                        ...prev,
                        [mismatch.jobId]: e.target.value
                      }))}
                      placeholder="e.g., Customer requested this specific worker"
                      className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowOverride(prev => ({ ...prev, [mismatch.jobId]: false }));
                          setOverrideReason(prev => {
                            const updated = { ...prev };
                            delete updated[mismatch.jobId];
                            return updated;
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOverride(mismatch)}
                        disabled={isLoading || !overrideReason[mismatch.jobId]?.trim()}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Confirm Override'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
