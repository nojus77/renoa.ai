'use client';

import { useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

interface CompletionChecklistProps {
  items: ChecklistItem[];
  completed: Record<string, boolean>;
  onChange: (itemId: string, checked: boolean) => void;
}

export default function CompletionChecklist({
  items,
  completed,
  onChange
}: CompletionChecklistProps) {
  const requiredItems = items.filter(item => item.required);
  const optionalItems = items.filter(item => !item.required);
  const allRequiredComplete = requiredItems.every(item => completed[item.id]);
  const completedCount = items.filter(item => completed[item.id]).length;

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          {completedCount}/{items.length} completed
        </span>
        <div className="h-2 flex-1 mx-3 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(completedCount / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Required items */}
      {requiredItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">
            Required
          </p>
          {requiredItems.map(item => (
            <ChecklistRow
              key={item.id}
              item={item}
              checked={completed[item.id] || false}
              onChange={(checked) => onChange(item.id, checked)}
            />
          ))}
        </div>
      )}

      {/* Optional items */}
      {optionalItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">
            Optional
          </p>
          {optionalItems.map(item => (
            <ChecklistRow
              key={item.id}
              item={item}
              checked={completed[item.id] || false}
              onChange={(checked) => onChange(item.id, checked)}
            />
          ))}
        </div>
      )}

      {/* Warning if required items incomplete */}
      {!allRequiredComplete && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-400">
            Complete all required items to continue
          </p>
        </div>
      )}
    </div>
  );
}

function ChecklistRow({
  item,
  checked,
  onChange
}: {
  item: ChecklistItem;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
        checked
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          checked
            ? 'bg-emerald-500 text-white'
            : 'bg-zinc-700 border-2 border-zinc-600'
        }`}
      >
        {checked && <Check className="w-4 h-4" />}
      </div>
      <span
        className={`text-sm text-left ${
          checked ? 'text-emerald-400' : 'text-zinc-300'
        }`}
      >
        {item.label}
        {item.required && (
          <span className="text-red-400 ml-1">*</span>
        )}
      </span>
    </button>
  );
}
