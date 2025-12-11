'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Problem {
  type: string;
  message: string;
  severity: 'warning' | 'error';
  actionLabel?: string;
  workerId?: string;
  day?: string;
}

interface Suggestion {
  type: string;
  message: string;
  impact?: string;
}

interface Opportunity {
  type: string;
  message: string;
  impact?: string;
}

interface WeekInsights {
  problems: Problem[];
  suggestions: Suggestion[];
  opportunities: Opportunity[];
}

interface WeekInsightsPanelProps {
  insights: WeekInsights;
  onOptimize?: () => Promise<void>;
  onProblemAction?: (problem: Problem) => void;
  onSuggestionApply?: (suggestion: Suggestion) => void;
}

export default function WeekInsightsPanel({
  insights,
  onOptimize,
  onProblemAction,
  onSuggestionApply,
}: WeekInsightsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  const hasContent =
    insights.problems.length > 0 ||
    insights.suggestions.length > 0 ||
    insights.opportunities.length > 0;

  if (!hasContent) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <h4 className="font-medium text-zinc-100 mb-1">Week Looks Great!</h4>
          <p className="text-sm text-zinc-500">
            No scheduling issues or optimization opportunities detected.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleOptimize = async () => {
    if (!onOptimize) return;
    setOptimizing(true);
    try {
      await onOptimize();
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-zinc-100">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Week Optimization Insights
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-100"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-5">
          {/* Problems */}
          {insights.problems.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Issues to Address ({insights.problems.length})
              </h4>
              <div className="space-y-2">
                {insights.problems.map((problem, i) => (
                  <Alert
                    key={i}
                    variant="destructive"
                    className="bg-red-500/10 border-red-500/30"
                  >
                    <AlertDescription className="flex items-center justify-between">
                      <span className="text-red-300">{problem.message}</span>
                      {problem.actionLabel && onProblemAction && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-3 border-red-500/50 text-red-300 hover:bg-red-500/20"
                          onClick={() => onProblemAction(problem)}
                        >
                          {problem.actionLabel}
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {insights.suggestions.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Optimization Suggestions ({insights.suggestions.length})
              </h4>
              <div className="space-y-2">
                {insights.suggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-blue-200">{suggestion.message}</p>
                      {suggestion.impact && (
                        <p className="text-xs text-blue-400/70 mt-1">
                          Impact: {suggestion.impact}
                        </p>
                      )}
                    </div>
                    {onSuggestionApply && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => onSuggestionApply(suggestion)}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {insights.opportunities.length > 0 && (
            <div>
              <h4 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Growth Opportunities ({insights.opportunities.length})
              </h4>
              <div className="space-y-2">
                {insights.opportunities.map((opp, i) => (
                  <div
                    key={i}
                    className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
                  >
                    <p className="text-sm text-emerald-200">{opp.message}</p>
                    {opp.impact && (
                      <p className="text-xs text-emerald-400/70 mt-1">
                        {opp.impact}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* One-click optimize */}
          {onOptimize && (
            <div className="pt-4 border-t border-zinc-800">
              <Button
                onClick={handleOptimize}
                disabled={optimizing}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                size="lg"
              >
                {optimizing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Auto-Optimize This Week
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-zinc-500 mt-2">
                AI will rebalance workloads and suggest improvements
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
