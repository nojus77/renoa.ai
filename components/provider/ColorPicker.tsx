'use client'

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Check, Palette } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Yellow', hex: '#f59e0b' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Lime', hex: '#84cc16' },
];

interface ColorPickerProps {
  color: string | null | undefined;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export default function ColorPicker({ color, onChange, disabled }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(color || '');

  const currentColor = color || '#6b7280'; // Default gray if no color

  const isValidHex = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex);

  const handleCustomColorChange = (value: string) => {
    // Auto-add # if user starts typing hex
    let formatted = value;
    if (value && !value.startsWith('#')) {
      formatted = '#' + value;
    }
    setCustomColor(formatted);

    if (isValidHex(formatted)) {
      onChange(formatted);
    }
  };

  const handlePresetClick = (hex: string) => {
    onChange(hex);
    setCustomColor(hex);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className="flex items-center gap-3 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div
            className="w-6 h-6 rounded-full border-2 border-zinc-700 flex-shrink-0"
            style={{ backgroundColor: currentColor }}
          />
          <span className="text-sm text-zinc-300 flex-1 text-left">
            {color ? color.toUpperCase() : 'Select color'}
          </span>
          <Palette className="h-4 w-4 text-zinc-500" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-64 bg-zinc-900 border-zinc-800 p-3" align="start">
        <div className="space-y-3">
          {/* Preset Colors Grid */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Preset Colors</p>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => handlePresetClick(preset.hex)}
                  className="relative w-8 h-8 rounded-lg border-2 border-zinc-700 hover:border-zinc-500 transition-colors group"
                  style={{ backgroundColor: preset.hex }}
                  title={preset.name}
                >
                  {color?.toLowerCase() === preset.hex.toLowerCase() && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Custom Color</p>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-lg border-2 border-zinc-700 flex-shrink-0"
                style={{
                  backgroundColor: isValidHex(customColor) ? customColor : currentColor
                }}
              />
              <Input
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                placeholder="#3b82f6"
                maxLength={7}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-sm uppercase"
              />
            </div>
            {customColor && !isValidHex(customColor) && (
              <p className="text-xs text-red-400 mt-1">
                Enter valid hex (e.g., #3b82f6)
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="pt-2 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 mb-2">Preview on Calendar</p>
            <div className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: currentColor }}
              />
              <span className="text-sm text-zinc-300">John Smith</span>
              <span className="text-xs text-zinc-500 ml-auto">9:00 AM</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
