'use client'

import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';

const COMMON_SKILLS = [
  'Landscaping',
  'Lawn Care',
  'Irrigation',
  'Hardscaping',
  'Tree Service',
  'Snow Removal',
  'Lawn Mowing',
  'Mulching',
  'Planting',
  'Fertilization',
  'Pest Control',
  'Equipment Operation',
  'Pruning',
  'Hedge Trimming',
  'Leaf Removal',
  'Garden Design',
];

interface SkillsTagInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  disabled?: boolean;
}

export default function SkillsTagInput({ skills, onChange, disabled }: SkillsTagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizeSkill = (skill: string) => skill.trim().toLowerCase();

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (!trimmedSkill) return;

    // Check for duplicates (case-insensitive)
    const exists = skills.some(s => normalizeSkill(s) === normalizeSkill(trimmedSkill));
    if (exists) {
      setInputValue('');
      return;
    }

    onChange([...skills, trimmedSkill]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      removeSkill(skills.length - 1);
    }
  };

  const filteredSuggestions = COMMON_SKILLS.filter(skill => {
    const matchesInput = skill.toLowerCase().includes(inputValue.toLowerCase());
    const notAlreadyAdded = !skills.some(s => normalizeSkill(s) === normalizeSkill(skill));
    return matchesInput && notAlreadyAdded && inputValue.length > 0;
  });

  return (
    <div className="space-y-2">
      {/* Current Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 px-2.5 py-1 text-sm flex items-center gap-1.5"
            >
              {skill}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="hover:text-emerald-100 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Input */}
      {!disabled && (
        <div className="relative">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder="Type a skill and press Enter..."
              className="bg-zinc-900 border-zinc-800 text-zinc-100"
            />
            <button
              type="button"
              onClick={() => addSkill(inputValue)}
              disabled={!inputValue.trim()}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <Plus className="h-4 w-4 text-zinc-300" />
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg max-h-48 overflow-auto">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSkill(suggestion)}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Add Suggestions */}
      {!disabled && skills.length < 3 && (
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="text-xs text-zinc-500 mr-1">Quick add:</span>
          {COMMON_SKILLS.filter(s => !skills.some(sk => normalizeSkill(sk) === normalizeSkill(s)))
            .slice(0, 5)
            .map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                className="text-xs px-2 py-0.5 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
              >
                + {skill}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
