'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, AlertCircle, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatInProviderTz } from '@/lib/utils/timezone';

interface CrewMember {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  skills: string[];
}

interface Crew {
  id: string;
  name: string;
  color: string;
  members: CrewMember[];
}

interface JobInfo {
  id: string;
  startTime: Date;
  endTime: Date;
  serviceType: string;
}

interface Conflict {
  userId: string;
  userName: string;
  job: {
    id: string;
    serviceType: string;
    startTime: string;
  };
}

interface AvailabilityData {
  available: string[];
  busy: string[];
  conflicts: Conflict[];
}

interface CrewCardProps {
  crew: Crew;
  job: JobInfo;
  providerId: string;
  onSelect: () => void;
  isAssigning?: boolean;
}

export default function CrewCard({
  crew,
  job,
  providerId,
  onSelect,
  isAssigning = false,
}: CrewCardProps) {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCrewAvailability();
  }, [crew.id, job.startTime, job.endTime]);

  const checkCrewAvailability = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/provider/crews/${crew.id}/availability?` +
        `start=${job.startTime.toISOString()}&end=${job.endTime.toISOString()}&providerId=${providerId}`
      );

      if (!res.ok) {
        throw new Error('Failed to check availability');
      }

      const data = await res.json();
      setAvailability(data);
    } catch (err) {
      console.error('Error checking crew availability:', err);
      setError('Could not check availability');
    } finally {
      setLoading(false);
    }
  };

  const hasConflicts = availability?.busy && availability.busy.length > 0;
  const allAvailable = availability?.available?.length === crew.members.length;
  const partiallyAvailable = !allAvailable && !hasConflicts && availability?.available && availability.available.length > 0;

  // Check if crew has skills for the job
  const crewSkills = crew.members.flatMap(m => m.skills.map(s => s.toLowerCase()));
  const jobSkillLower = job.serviceType.toLowerCase();
  const hasRelevantSkill = crewSkills.some(skill =>
    skill.includes(jobSkillLower) || jobSkillLower.includes(skill)
  );

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all hover:border-blue-500/50 bg-zinc-900',
        hasConflicts ? 'border-red-500/30' : allAvailable ? 'border-emerald-500/30' : 'border-zinc-700'
      )}
    >
      <div className="flex items-start justify-between">
        {/* Crew info */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: crew.color + '20', color: crew.color }}
          >
            <Users className="w-6 h-6" />
          </div>

          <div>
            <div className="font-semibold text-lg text-zinc-100">{crew.name}</div>
            <div className="text-sm text-zinc-400">
              {crew.members.length} member{crew.members.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Availability badge */}
        <div>
          {loading ? (
            <Badge variant="secondary" className="bg-zinc-700">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Checking...
            </Badge>
          ) : error ? (
            <Badge variant="secondary" className="bg-zinc-700">Unknown</Badge>
          ) : allAvailable ? (
            <Badge className="bg-emerald-500 text-white">
              <Check className="h-3 w-3 mr-1" />
              All Available
            </Badge>
          ) : hasConflicts ? (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              {availability.busy.length} Conflict{availability.busy.length !== 1 ? 's' : ''}
            </Badge>
          ) : partiallyAvailable ? (
            <Badge className="bg-yellow-500 text-white">
              {availability.available.length}/{crew.members.length} Available
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-zinc-700">Unavailable</Badge>
          )}
        </div>
      </div>

      {/* Member avatars */}
      <div className="mt-3 flex -space-x-2">
        {crew.members.map((member) => {
          const isAvailable = availability?.available?.includes(member.id);
          const isBusy = availability?.busy?.includes(member.id);

          return (
            <div key={member.id} className="relative">
              <Avatar
                className={cn(
                  'border-2 border-zinc-900 h-9 w-9',
                  isBusy && 'opacity-50'
                )}
              >
                {member.photo ? (
                  <AvatarImage src={member.photo} alt={member.name} />
                ) : null}
                <AvatarFallback
                  className="text-xs"
                  style={{ backgroundColor: crew.color, color: 'white' }}
                >
                  {member.firstName[0]}{member.lastName[0]}
                </AvatarFallback>
              </Avatar>
              {/* Availability indicator */}
              {!loading && (
                <div
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900',
                    isAvailable ? 'bg-emerald-500' : isBusy ? 'bg-red-500' : 'bg-zinc-500'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Skills match indicator */}
      {hasRelevantSkill && (
        <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400">
          <Check className="h-3 w-3" />
          <span>Has {job.serviceType} experience</span>
        </div>
      )}

      {/* Conflicts detail */}
      {hasConflicts && !loading && availability?.conflicts && availability.conflicts.length > 0 && (
        <Alert variant="destructive" className="mt-3 bg-red-500/10 border-red-500/30">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-red-400">Scheduling Conflicts</AlertTitle>
          <AlertDescription className="text-red-300/80">
            {availability.conflicts.map((c) => (
              <div key={c.userId} className="text-sm">
                • {c.userName} has {c.job.serviceType} at {formatInProviderTz(c.job.startTime, 'h:mm a', 'America/Chicago')}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Assign button */}
      <Button
        onClick={onSelect}
        className={cn(
          'w-full mt-3',
          hasConflicts
            ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
            : 'bg-blue-600 hover:bg-blue-700'
        )}
        disabled={isAssigning}
      >
        {isAssigning ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Assigning...
          </>
        ) : hasConflicts ? (
          'Assign Anyway'
        ) : (
          `Assign ${crew.name}`
        )}
      </Button>
    </div>
  );
}
