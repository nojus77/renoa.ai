"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Award, Plus, Trash2, Calendar, Star } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
}

interface WorkerSkill {
  id: string;
  skillId: string;
  level: string;
  certifiedDate?: string | null;
  expiresAt?: string | null;
  skill: Skill;
}

interface WorkerSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  workerName: string;
  providerId: string;
  onUpdate?: () => void;
}

export default function WorkerSkillsModal({
  isOpen,
  onClose,
  workerId,
  workerName,
  providerId,
  onUpdate,
}: WorkerSkillsModalProps) {
  const [workerSkills, setWorkerSkills] = useState<WorkerSkill[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Add skill state
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [skillLevel, setSkillLevel] = useState("basic");
  const [certifiedDate, setCertifiedDate] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchWorkerSkills();
      fetchAvailableSkills();
    }
  }, [isOpen, workerId]);

  const fetchWorkerSkills = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/provider/team/${workerId}/skills`);
      if (!res.ok) throw new Error("Failed to fetch worker skills");
      const data = await res.json();
      setWorkerSkills(data);
    } catch (error) {
      console.error("Error fetching worker skills:", error);
      toast.error("Failed to load worker skills");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSkills = async () => {
    try {
      const res = await fetch(`/api/provider/skills?providerId=${providerId}`);
      if (!res.ok) throw new Error("Failed to fetch available skills");
      const data = await res.json();
      setAvailableSkills(data);
    } catch (error) {
      console.error("Error fetching available skills:", error);
      toast.error("Failed to load available skills");
    }
  };

  const handleAddSkill = async () => {
    if (!selectedSkillId) {
      toast.error("Please select a skill");
      return;
    }

    try {
      setAdding(true);
      const res = await fetch(`/api/provider/team/${workerId}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: selectedSkillId,
          level: skillLevel,
          certifiedDate: certifiedDate || null,
          expiresAt: expiresAt || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add skill");
      }

      toast.success("Skill added successfully");
      fetchWorkerSkills();
      setSelectedSkillId("");
      setSkillLevel("basic");
      setCertifiedDate("");
      setExpiresAt("");
      onUpdate?.();
    } catch (error: any) {
      console.error("Error adding skill:", error);
      toast.error(error.message || "Failed to add skill");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveSkill = async (skillId: string, skillName: string) => {
    if (!confirm(`Remove "${skillName}" skill from ${workerName}?`)) return;

    try {
      const res = await fetch(`/api/provider/team/${workerId}/skills?skillId=${skillId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove skill");

      toast.success("Skill removed successfully");
      fetchWorkerSkills();
      onUpdate?.();
    } catch (error) {
      console.error("Error removing skill:", error);
      toast.error("Failed to remove skill");
    }
  };

  const getCategoryColor = (category?: string | null) => {
    switch (category) {
      case "landscaping":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "tree_work":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "hardscaping":
        return "bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-200";
      case "irrigation":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "equipment":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "certification":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "expert":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "intermediate":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString();
  };

  // Filter out already assigned skills
  const unassignedSkills = availableSkills.filter(
    (skill) => !workerSkills.some((ws) => ws.skillId === skill.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Skills for {workerName}
          </DialogTitle>
          <DialogDescription>Manage worker skills, certifications, and proficiency levels</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Skill Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Skill
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Skill</Label>
                <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedSkills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        <div className="flex items-center gap-2">
                          <span>{skill.name}</span>
                          {skill.category && (
                            <Badge variant="outline" className="text-xs">
                              {skill.category.replace("_", " ")}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Proficiency Level</Label>
                <Select value={skillLevel} onValueChange={setSkillLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Certified Date (Optional)</Label>
                <Input type="date" value={certifiedDate} onChange={(e) => setCertifiedDate(e.target.value)} />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Expires At (Optional)</Label>
                <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
            </div>

            <Button onClick={handleAddSkill} disabled={adding || !selectedSkillId} className="w-full">
              {adding ? "Adding..." : "Add Skill"}
            </Button>
          </div>

          {/* Current Skills List */}
          <div className="space-y-3">
            <h3 className="font-medium">Current Skills ({workerSkills.length})</h3>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading skills...</div>
            ) : workerSkills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No skills assigned yet. Add skills above to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {workerSkills.map((workerSkill) => (
                  <div
                    key={workerSkill.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{workerSkill.skill.name}</span>
                        {workerSkill.skill.category && (
                          <Badge className={`text-xs ${getCategoryColor(workerSkill.skill.category)}`}>
                            {workerSkill.skill.category.replace("_", " ")}
                          </Badge>
                        )}
                        <Badge className={`text-xs ${getLevelColor(workerSkill.level)}`}>
                          {workerSkill.level}
                        </Badge>
                      </div>

                      {(workerSkill.certifiedDate || workerSkill.expiresAt) && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {workerSkill.certifiedDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Certified: {formatDate(workerSkill.certifiedDate)}
                            </span>
                          )}
                          {workerSkill.expiresAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Expires: {formatDate(workerSkill.expiresAt)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSkill(workerSkill.skillId, workerSkill.skill.name)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
