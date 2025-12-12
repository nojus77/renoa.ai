'use client'

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Skill {
  id: string;
  name: string;
  category?: string | null;
}

interface WorkerSkill {
  id: string;
  skillId: string;
  level: string;
  skill: Skill;
}

interface SkillsCheckboxPickerProps {
  workerId: string;
  workerSkills: WorkerSkill[];
  onSkillsChange: (skills: WorkerSkill[]) => void;
  disabled?: boolean;
}

export default function SkillsCheckboxPicker({
  workerId,
  workerSkills,
  onSkillsChange,
  disabled
}: SkillsCheckboxPickerProps) {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showNewSkill, setShowNewSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [creatingSkill, setCreatingSkill] = useState(false);

  // Fetch available skills for the provider
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const providerId = localStorage.getItem('providerId');
        if (!providerId) return;

        const res = await fetch(`/api/provider/skills?providerId=${providerId}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableSkills(data);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  const assignedSkillIds = new Set(workerSkills.map(ws => ws.skillId));

  const handleToggleSkill = async (skill: Skill, isChecked: boolean) => {
    if (disabled) return;
    setSaving(skill.id);

    try {
      if (isChecked) {
        // Assign skill
        const res = await fetch(`/api/provider/team/${workerId}/skills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillId: skill.id, level: 'basic' }),
        });

        if (res.ok) {
          const newWorkerSkill = await res.json();
          onSkillsChange([...workerSkills, newWorkerSkill]);
        } else {
          const data = await res.json();
          toast.error(data.error || 'Failed to assign skill');
        }
      } else {
        // Remove skill
        const res = await fetch(`/api/provider/team/${workerId}/skills?skillId=${skill.id}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          onSkillsChange(workerSkills.filter(ws => ws.skillId !== skill.id));
        } else {
          const data = await res.json();
          toast.error(data.error || 'Failed to remove skill');
        }
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setSaving(null);
    }
  };

  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) return;
    setCreatingSkill(true);

    try {
      const providerId = localStorage.getItem('providerId');
      if (!providerId) {
        toast.error('Not logged in');
        return;
      }

      // Create the skill
      const res = await fetch('/api/provider/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          name: newSkillName.trim(),
          category: 'general',
        }),
      });

      if (res.ok) {
        const newSkill = await res.json();
        setAvailableSkills([...availableSkills, newSkill]);
        setNewSkillName('');
        setShowNewSkill(false);
        toast.success(`Skill "${newSkill.name}" created`);

        // Auto-assign to current worker
        handleToggleSkill(newSkill, true);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create skill');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setCreatingSkill(false);
    }
  };

  // Group skills by category
  const skillsByCategory = availableSkills.reduce((acc, skill) => {
    const category = skill.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        <span className="ml-2 text-sm text-zinc-500">Loading skills...</span>
      </div>
    );
  }

  if (availableSkills.length === 0 && !showNewSkill) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-zinc-500">No skills defined yet.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowNewSkill(true)}
          className="border-zinc-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create First Skill
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Assigned Skills Preview */}
      {workerSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-zinc-800">
          {workerSkills.map(ws => (
            <Badge
              key={ws.id}
              variant="secondary"
              className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            >
              {ws.skill.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Skills by Category */}
      {Object.entries(skillsByCategory).map(([category, skills]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            {category}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {skills.map(skill => {
              const isAssigned = assignedSkillIds.has(skill.id);
              const isSaving = saving === skill.id;

              return (
                <label
                  key={skill.id}
                  className={`
                    flex items-center gap-2 p-2 rounded-md border transition-colors cursor-pointer
                    ${isAssigned
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                    }
                    ${disabled || isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  ) : (
                    <Checkbox
                      checked={isAssigned}
                      onCheckedChange={(checked) => handleToggleSkill(skill, checked as boolean)}
                      disabled={disabled || isSaving}
                      className="border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                  )}
                  <span className={`text-sm ${isAssigned ? 'text-emerald-300' : 'text-zinc-300'}`}>
                    {skill.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {/* Add New Skill */}
      {!showNewSkill ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowNewSkill(true)}
          disabled={disabled}
          className="text-zinc-400 hover:text-zinc-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Skill
        </Button>
      ) : (
        <div className="flex gap-2">
          <Input
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Enter skill name..."
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateSkill();
              }
              if (e.key === 'Escape') {
                setShowNewSkill(false);
                setNewSkillName('');
              }
            }}
            disabled={creatingSkill}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleCreateSkill}
            disabled={!newSkillName.trim() || creatingSkill}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            {creatingSkill ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Add'
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowNewSkill(false);
              setNewSkillName('');
            }}
            disabled={creatingSkill}
            className="text-zinc-400"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
