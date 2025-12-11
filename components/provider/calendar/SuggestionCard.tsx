'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Star,
  Loader2,
  TrendingUp,
  Clock,
  MapPin,
  Zap,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkerScore } from '@/lib/assignment-scoring';

interface SuggestionCardProps {
  suggestion: WorkerScore;
  rank: number;
  isAssigning: boolean;
  onSelect: () => void;
}

// Score bar component
function ScoreBar({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="flex items-center gap-1 text-zinc-400">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className="text-zinc-300">{Math.round(score)}%</span>
      </div>
      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getBarColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function SuggestionCard({
  suggestion,
  rank,
  isAssigning,
  onSelect,
}: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const matchQualityStyles = {
    excellent: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      icon: Star,
      label: 'Excellent Match',
    },
    good: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: CheckCircle,
      label: 'Good Match',
    },
    fair: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: TrendingUp,
      label: 'Fair Match',
    },
    poor: {
      bg: 'bg-zinc-500/10',
      border: 'border-zinc-500/30',
      text: 'text-zinc-400',
      icon: AlertTriangle,
      label: 'Limited Match',
    },
  };

  const style = matchQualityStyles[suggestion.matchQuality];
  const MatchIcon = style.icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all hover:border-zinc-600',
        style.border,
        style.bg
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Worker info */}
        <div className="flex items-center gap-3">
          {/* Rank badge */}
          <div
            className={cn(
              'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
              rank === 1 ? 'bg-emerald-500 text-white' :
                rank === 2 ? 'bg-blue-500 text-white' :
                  rank === 3 ? 'bg-yellow-500 text-white' :
                    'bg-zinc-700 text-zinc-300'
            )}
          >
            {rank}
          </div>

          {/* Avatar */}
          {suggestion.workerPhoto ? (
            <img
              src={suggestion.workerPhoto}
              alt={suggestion.workerName}
              className="h-10 w-10 rounded-full object-cover border-2"
              style={{ borderColor: suggestion.workerColor }}
            />
          ) : (
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
              style={{ backgroundColor: suggestion.workerColor }}
            >
              {suggestion.workerName.split(' ').map(n => n[0]).join('')}
            </div>
          )}

          {/* Name & match quality */}
          <div>
            <div className="font-semibold text-zinc-100">{suggestion.workerName}</div>
            <div className={cn('flex items-center gap-1 text-sm', style.text)}>
              <MatchIcon className="h-3.5 w-3.5" />
              <span>{style.label}</span>
            </div>
          </div>
        </div>

        {/* Right: Score */}
        <div className="text-right">
          <div
            className={cn(
              'text-2xl font-bold',
              suggestion.totalScore >= 80 ? 'text-emerald-400' :
                suggestion.totalScore >= 60 ? 'text-blue-400' :
                  suggestion.totalScore >= 40 ? 'text-yellow-400' : 'text-zinc-400'
            )}
          >
            {suggestion.totalScore}%
          </div>
          <div className="text-xs text-zinc-500">Match Score</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center gap-3 mt-3 text-xs text-zinc-400">
        <span>{suggestion.jobsToday} jobs today</span>
        <span>•</span>
        <span>{suggestion.currentCapacity}% capacity</span>
      </div>

      {/* Reasoning Tags */}
      {suggestion.reasoning.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {suggestion.reasoning.map((reason, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="bg-zinc-800 text-zinc-300 border-0 text-xs"
            >
              {reason}
            </Badge>
          ))}
        </div>
      )}

      {/* Warnings */}
      {suggestion.warnings.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestion.warnings.map((warning, i) => (
            <Badge
              key={i}
              variant="outline"
              className="border-red-500/50 text-red-400 text-xs"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              {warning}
            </Badge>
          ))}
        </div>
      )}

      {/* Score Breakdown (Collapsible) */}
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-3 transition-colors">
          <span>View score breakdown</span>
          <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-2.5">
          <ScoreBar
            label="Skills Match"
            score={suggestion.factors.skillMatch}
            icon={Award}
          />
          <ScoreBar
            label="Availability"
            score={suggestion.factors.availability}
            icon={Clock}
          />
          <ScoreBar
            label="Capacity"
            score={suggestion.factors.capacity}
            icon={TrendingUp}
          />
          <ScoreBar
            label="Location"
            score={suggestion.factors.proximity}
            icon={MapPin}
          />
          <ScoreBar
            label="Performance"
            score={suggestion.factors.performance}
            icon={Zap}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Assign Button */}
      <Button
        onClick={onSelect}
        disabled={isAssigning}
        className={cn(
          'w-full mt-4',
          suggestion.matchQuality === 'excellent'
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : 'bg-blue-600 hover:bg-blue-700'
        )}
      >
        {isAssigning ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Assigning...
          </>
        ) : (
          <>
            Assign to {suggestion.workerName.split(' ')[0]}
          </>
        )}
      </Button>
    </div>
  );
}
