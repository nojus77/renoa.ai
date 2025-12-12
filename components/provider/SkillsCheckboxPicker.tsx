'use client';

import { useState, useEffect, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Skill {
  id: string;
  name: string;
  category?: string | null;
  isCustom?: boolean;
}

export interface WorkerSkill {
  id: string;
  skillId: string;
  level?: string;
  skill: Skill;
}

interface SkillsCheckboxPickerProps {
  workerId: string;
  workerSkills: WorkerSkill[];
  onSkillsChange: (skills: WorkerSkill[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  // Optional props for worker context (when not using provider localStorage)
  providerId?: string;
  providerCategory?: string;
}

// Map provider categories to relevant skill categories
const CATEGORY_SKILL_MAP: Record<string, string[]> = {
  'Landscaping & Lawn Care': ['Landscaping', 'Irrigation', 'Hardscaping', 'Equipment', 'Certifications'],
  'Tree Service': ['Tree Work', 'Equipment', 'Safety', 'Certifications'],
  'Roofing': ['Roofing', 'Safety', 'Equipment', 'Certifications'],
  'Plumbing': ['Plumbing', 'Equipment', 'Certifications'],
  'Electrical': ['Electrical', 'Safety', 'Equipment', 'Certifications'],
  'HVAC': ['HVAC', 'Equipment', 'Certifications'],
  'Painting': ['Painting', 'Equipment', 'Certifications'],
  'Cleaning': ['Cleaning', 'Equipment', 'Certifications'],
  'General Contracting': ['General', 'Hardscaping', 'Equipment', 'Safety', 'Certifications'],
  'Pest Control': ['Pest Control', 'Equipment', 'Certifications'],
  'Pool Service': ['Pool Service', 'Equipment', 'Certifications'],
  'Window Cleaning': ['Window Cleaning', 'Equipment', 'Safety', 'Certifications'],
  'Pressure Washing': ['Pressure Washing', 'Equipment', 'Certifications'],
  'Moving': ['Moving', 'Equipment', 'Certifications'],
  'Handyman': ['Handyman', 'General', 'Equipment', 'Certifications'],
};

// Group categories into main sections for clear UI organization
const SECTION_GROUPS = {
  skills: [
    'Landscaping', 'Irrigation', 'Hardscaping', 'Tree Work', 'Roofing',
    'Plumbing', 'Electrical', 'HVAC', 'Painting', 'Cleaning', 'General',
    'Pest Control', 'Pool Service', 'Window Cleaning', 'Pressure Washing',
    'Moving', 'Handyman'
  ],
  equipment: ['Equipment', 'Safety'],
  certifications: ['Certifications'],
};

// Default skills by category
const DEFAULT_SKILLS: Record<string, string[]> = {
  Landscaping: [
    'Mowing & Edging',
    'Trimming & Pruning',
    'Mulching',
    'Planting',
    'Garden Design',
    'Sod Installation',
    'Aeration',
    'Fertilization',
    'Weed Control',
  ],
  Hardscaping: [
    'Paver Installation',
    'Retaining Walls',
    'Concrete Work',
    'Stone Work',
    'Outdoor Kitchens',
    'Fire Pits',
  ],
  Irrigation: [
    'Sprinkler Installation',
    'Sprinkler Repair',
    'Drip Systems',
    'Backflow Testing',
    'Winterization',
  ],
  'Tree Work': [
    'Tree Trimming',
    'Tree Removal',
    'Stump Grinding',
    'Tree Planting',
    'Emergency Storm Response',
    'Cabling & Bracing',
  ],
  Roofing: [
    'Shingle Installation',
    'Metal Roofing',
    'Flat Roofing',
    'Roof Repair',
    'Gutter Installation',
    'Skylight Installation',
    'Roof Inspection',
  ],
  Plumbing: [
    'Pipe Repair',
    'Drain Cleaning',
    'Water Heater',
    'Fixture Installation',
    'Leak Detection',
    'Sewer Line',
    'Gas Line',
  ],
  Electrical: [
    'Wiring',
    'Panel Upgrade',
    'Outlet Installation',
    'Lighting',
    'Ceiling Fan',
    'Generator',
    'EV Charger',
  ],
  HVAC: ['AC Installation', 'AC Repair', 'Furnace Repair', 'Duct Work', 'Maintenance'],
  Painting: [
    'Interior Painting',
    'Exterior Painting',
    'Staining',
    'Pressure Washing',
    'Cabinet Painting',
  ],
  Cleaning: ['Deep Cleaning', 'Move In/Out', 'Office Cleaning', 'Window Cleaning', 'Carpet Cleaning'],
  General: ['Framing', 'Drywall', 'Flooring', 'Tiling', 'Cabinet Installation', 'Finish Carpentry'],
  Equipment: [
    'Zero-Turn Mower',
    'Walk-Behind Mower',
    'String Trimmer',
    'Backpack Blower',
    'Chainsaw',
    'Hedge Trimmer',
    'Pressure Washer',
    'Air Compressor',
    'Generator',
    "16' Extension Ladder",
    "24' Extension Ladder",
    "32' Extension Ladder",
    'Step Ladder',
    'Power Drill',
    'Circular Saw',
    'Reciprocating Saw',
    'Wet/Dry Vacuum',
    'Hand Tools',
    'Work Truck',
    'Trailer (Open)',
    'Trailer (Enclosed)',
    'Dump Trailer',
    '1/2 Ton Truck',
    '3/4 Ton Truck',
    '1 Ton Truck',
    'Skid Steer',
    'Mini Excavator',
  ],
  Safety: [
    'Safety Harness',
    'Hard Hat',
    'Steel Toe Boots',
    'Safety Glasses',
    'Hearing Protection',
    'Hi-Vis Vest',
  ],
  Certifications: [
    'CPR Certified',
    'OSHA 10',
    'OSHA 30',
    'Pesticide License',
    'Electrical License',
    'Plumbing License',
    'HVAC License',
    "CDL (Commercial Driver's)",
    'Arborist Certified',
    'EPA 608',
    'First Aid',
  ],
};

export default function SkillsCheckboxPicker({
  workerId,
  workerSkills,
  onSkillsChange,
  disabled,
  readOnly = false,
  providerId: propProviderId,
  providerCategory: propProviderCategory,
}: SkillsCheckboxPickerProps) {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [providerCategory, setProviderCategory] = useState<string | null>(propProviderCategory || null);
  const [resolvedProviderId, setResolvedProviderId] = useState<string | null>(propProviderId || null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Equipment', 'Certifications'])
  );
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [creatingCustom, setCreatingCustom] = useState<string | null>(null);

  // Fetch provider info and skills
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use prop providerId, or try localStorage (provider context, then worker context)
        const providerId = propProviderId || localStorage.getItem('providerId') || localStorage.getItem('workerProviderId');
        if (!providerId) return;

        setResolvedProviderId(providerId);

        // Only fetch provider info if not passed via props
        if (!propProviderCategory) {
          const providerRes = await fetch(`/api/provider/settings/business?providerId=${providerId}`);
          if (providerRes.ok) {
            const providerData = await providerRes.json();
            setProviderCategory(providerData.provider?.primaryCategory || null);
          }
        }

        // Fetch existing skills
        const skillsRes = await fetch(`/api/provider/skills?providerId=${providerId}`);
        if (skillsRes.ok) {
          const data = await skillsRes.json();
          setAvailableSkills(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propProviderId, propProviderCategory]);

  const assignedSkillIds = new Set(workerSkills.map((ws) => ws.skillId));

  // Get relevant skill categories based on provider's primary category
  const getRelevantCategories = useCallback((): string[] => {
    if (!providerCategory) {
      // If no category set, show all common ones
      return ['Equipment', 'Certifications', 'General'];
    }
    return CATEGORY_SKILL_MAP[providerCategory] || ['Equipment', 'Certifications', 'General'];
  }, [providerCategory]);

  // Build skill list: combine existing DB skills with defaults
  const getSkillsForCategory = useCallback(
    (category: string): Skill[] => {
      const existingSkills = availableSkills.filter((s) => s.category === category);
      const existingNames = new Set(existingSkills.map((s) => s.name.toLowerCase()));

      // Get default skills for this category that don't exist yet
      const defaultSkillsForCategory = DEFAULT_SKILLS[category] || [];
      const missingDefaults = defaultSkillsForCategory.filter(
        (name) => !existingNames.has(name.toLowerCase())
      );

      // Return existing skills, plus placeholders for defaults (will be created on first use)
      return [
        ...existingSkills,
        ...missingDefaults.map((name) => ({
          id: `default-${category}-${name}`,
          name,
          category,
          isCustom: false,
        })),
      ].sort((a, b) => a.name.localeCompare(b.name));
    },
    [availableSkills]
  );

  const handleToggleSkill = async (skill: Skill, isChecked: boolean) => {
    if (disabled || readOnly) return;
    setSaving(skill.id);

    try {
      const providerId = resolvedProviderId || localStorage.getItem('providerId') || localStorage.getItem('workerProviderId');
      let actualSkillId = skill.id;

      // If this is a default skill that doesn't exist yet, create it first
      if (skill.id.startsWith('default-')) {
        const createRes = await fetch('/api/provider/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            name: skill.name,
            category: skill.category,
          }),
        });

        if (!createRes.ok) {
          const data = await createRes.json();
          toast.error(data.error || 'Failed to create skill');
          return;
        }

        const newSkill = await createRes.json();
        actualSkillId = newSkill.id;
        setAvailableSkills((prev) => [...prev, newSkill]);
      }

      if (isChecked) {
        // Assign skill
        const res = await fetch(`/api/provider/team/${workerId}/skills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillId: actualSkillId, level: 'basic' }),
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
        const res = await fetch(`/api/provider/team/${workerId}/skills?skillId=${actualSkillId}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          onSkillsChange(workerSkills.filter((ws) => ws.skillId !== actualSkillId));
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

  const handleCreateCustom = async (category: string) => {
    const name = customInputs[category]?.trim();
    if (!name) return;

    setCreatingCustom(category);
    try {
      const providerId = resolvedProviderId || localStorage.getItem('providerId') || localStorage.getItem('workerProviderId');
      if (!providerId) {
        toast.error('Not logged in');
        return;
      }

      const res = await fetch('/api/provider/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          name,
          category,
          isCustom: true,
        }),
      });

      if (res.ok) {
        const newSkill = await res.json();
        setAvailableSkills((prev) => [...prev, newSkill]);
        setCustomInputs((prev) => ({ ...prev, [category]: '' }));
        toast.success(`"${name}" added`);

        // Auto-assign to worker
        handleToggleSkill(newSkill, true);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setCreatingCustom(null);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        <span className="ml-2 text-sm text-zinc-500">Loading skills...</span>
      </div>
    );
  }

  // Read-only mode - just show badges
  if (readOnly) {
    return (
      <div className="space-y-3">
        {workerSkills.length === 0 ? (
          <p className="text-sm text-zinc-500">No skills assigned</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {workerSkills.map((ws) => (
              <Badge
                key={ws.id}
                variant="secondary"
                className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              >
                {ws.skill.name}
                {ws.skill.isCustom && (
                  <span className="ml-1 text-[10px] text-emerald-400/60">Custom</span>
                )}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-zinc-500">Skills are managed by your admin</p>
      </div>
    );
  }

  const relevantCategories = getRelevantCategories();

  // Group categories into sections
  const skillCategories = relevantCategories.filter(c => SECTION_GROUPS.skills.includes(c));
  const equipmentCategories = relevantCategories.filter(c => SECTION_GROUPS.equipment.includes(c));
  const certificationCategories = relevantCategories.filter(c => SECTION_GROUPS.certifications.includes(c));

  // Helper function to render a category section
  const renderCategory = (category: string) => {
          const skills = getSkillsForCategory(category);
          const isExpanded = expandedCategories.has(category);
          const assignedInCategory = skills.filter(
            (s) =>
              assignedSkillIds.has(s.id) ||
              workerSkills.some((ws) => ws.skill.name === s.name && ws.skill.category === category)
          ).length;

          return (
            <div key={category} className="border border-zinc-800 rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  )}
                  <span className="text-sm font-medium text-zinc-200">{category}</span>
                  {assignedInCategory > 0 && (
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-xs">
                      {assignedInCategory}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-zinc-500">{skills.length} items</span>
              </button>

              {/* Skills Grid */}
              {isExpanded && (
                <div className="p-3 bg-zinc-950/30 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {skills.slice(0, 12).map((skill) => {
                      const isAssigned =
                        assignedSkillIds.has(skill.id) ||
                        workerSkills.some(
                          (ws) => ws.skill.name === skill.name && ws.skill.category === category
                        );
                      const isSaving = saving === skill.id;

                      return (
                        <label
                          key={skill.id}
                          className={`
                            flex items-center gap-2 p-2 rounded-md border transition-colors cursor-pointer text-sm
                            ${
                              isAssigned
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                            }
                            ${disabled || isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-400 shrink-0" />
                          ) : (
                            <Checkbox
                              checked={isAssigned}
                              onCheckedChange={(checked) =>
                                handleToggleSkill(skill, checked as boolean)
                              }
                              disabled={disabled || isSaving}
                              className="border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 shrink-0"
                            />
                          )}
                          <span
                            className={`truncate ${isAssigned ? 'text-emerald-300' : 'text-zinc-300'}`}
                          >
                            {skill.name}
                          </span>
                          {skill.isCustom && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0 border-zinc-600 text-zinc-500"
                            >
                              Custom
                            </Badge>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {/* Show more if more than 12 */}
                  {skills.length > 12 && (
                    <details className="group">
                      <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400">
                        Show {skills.length - 12} more...
                      </summary>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {skills.slice(12).map((skill) => {
                          const isAssigned =
                            assignedSkillIds.has(skill.id) ||
                            workerSkills.some(
                              (ws) => ws.skill.name === skill.name && ws.skill.category === category
                            );
                          const isSaving = saving === skill.id;

                          return (
                            <label
                              key={skill.id}
                              className={`
                                flex items-center gap-2 p-2 rounded-md border transition-colors cursor-pointer text-sm
                                ${
                                  isAssigned
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                                }
                                ${disabled || isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin text-zinc-400 shrink-0" />
                              ) : (
                                <Checkbox
                                  checked={isAssigned}
                                  onCheckedChange={(checked) =>
                                    handleToggleSkill(skill, checked as boolean)
                                  }
                                  disabled={disabled || isSaving}
                                  className="border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 shrink-0"
                                />
                              )}
                              <span
                                className={`truncate ${isAssigned ? 'text-emerald-300' : 'text-zinc-300'}`}
                              >
                                {skill.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </details>
                  )}

                  {/* Add Custom */}
                  {!disabled && (
                    <div className="pt-2 border-t border-zinc-800">
                      <div className="flex gap-2">
                        <Input
                          value={customInputs[category] || ''}
                          onChange={(e) =>
                            setCustomInputs((prev) => ({
                              ...prev,
                              [category]: e.target.value,
                            }))
                          }
                          placeholder={`Add custom ${category.toLowerCase()}...`}
                          className="bg-zinc-900 border-zinc-800 text-zinc-100 text-sm h-8"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateCustom(category);
                            }
                          }}
                          disabled={creatingCustom === category}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleCreateCustom(category)}
                          disabled={!customInputs[category]?.trim() || creatingCustom === category}
                          className="bg-zinc-800 hover:bg-zinc-700 h-8 px-2"
                        >
                          {creatingCustom === category ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
  };

  return (
    <div className="space-y-5">
      {/* Skills Section */}
      {skillCategories.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
              Skills
            </h4>
            <span className="text-xs text-zinc-500">— What they can do</span>
          </div>
          <div className="space-y-2">
            {skillCategories.map((category) => renderCategory(category))}
          </div>
        </div>
      )}

      {/* Equipment Section */}
      {equipmentCategories.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
              Equipment
            </h4>
            <span className="text-xs text-zinc-500">— Tools & vehicles they can operate</span>
          </div>
          <div className="space-y-2">
            {equipmentCategories.map((category) => renderCategory(category))}
          </div>
        </div>
      )}

      {/* Certifications Section */}
      {certificationCategories.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
              Certifications
            </h4>
            <span className="text-xs text-zinc-500">— Licenses & training they have</span>
          </div>
          <div className="space-y-2">
            {certificationCategories.map((category) => renderCategory(category))}
          </div>
        </div>
      )}
    </div>
  );
}
