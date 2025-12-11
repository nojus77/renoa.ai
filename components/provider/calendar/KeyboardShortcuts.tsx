'use client';

import { useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface ShortcutRowProps {
  keys: string[];
  description: string;
}

function ShortcutRow({ keys, description }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
      <span className="text-zinc-300">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i}>
            <kbd className="px-2 py-1 text-xs font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-300">
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="mx-0.5 text-zinc-600">+</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 mt-4">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
            Navigation
          </div>
          <ShortcutRow keys={['T']} description="Jump to today" />
          <ShortcutRow keys={['←']} description="Previous day" />
          <ShortcutRow keys={['→']} description="Next day" />
          <ShortcutRow keys={['W']} description="Toggle week view" />
        </div>

        <div className="space-y-1 mt-4">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
            Actions
          </div>
          <ShortcutRow keys={['⌘', 'A']} description="Auto-assign all jobs" />
          <ShortcutRow keys={['⌘', 'N']} description="Create new job" />
          <ShortcutRow keys={['R']} description="Refresh calendar" />
        </div>

        <div className="space-y-1 mt-4">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
            General
          </div>
          <ShortcutRow keys={['?']} description="Show this dialog" />
          <ShortcutRow keys={['Esc']} description="Close dialog" />
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-500">
          Tip: Drag jobs between workers to reassign, or up/down to reschedule.
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface UseKeyboardShortcutsProps {
  onJumpToToday: () => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToggleWeekView?: () => void;
  onAutoAssign?: () => void;
  onNewJob?: () => void;
  onRefresh: () => void;
  onShowShortcuts: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onJumpToToday,
  onPreviousDay,
  onNextDay,
  onToggleWeekView,
  onAutoAssign,
  onNewJob,
  onRefresh,
  onShowShortcuts,
  enabled = true,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Escape - close modals (handled by Dialog component)
      if (e.key === 'Escape') {
        return;
      }

      // T - Jump to Today
      if (e.key === 't' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onJumpToToday();
        return;
      }

      // Arrow Left - Previous day
      if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onPreviousDay();
        return;
      }

      // Arrow Right - Next day
      if (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onNextDay();
        return;
      }

      // W - Toggle week view
      if (e.key === 'w' && !e.metaKey && !e.ctrlKey && onToggleWeekView) {
        e.preventDefault();
        onToggleWeekView();
        return;
      }

      // Cmd/Ctrl + A - Auto-assign all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && onAutoAssign) {
        e.preventDefault();
        onAutoAssign();
        return;
      }

      // Cmd/Ctrl + N - New job
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && onNewJob) {
        e.preventDefault();
        onNewJob();
        return;
      }

      // R - Refresh
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onRefresh();
        return;
      }

      // ? - Show shortcuts
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        onShowShortcuts();
        return;
      }
    },
    [
      enabled,
      onJumpToToday,
      onPreviousDay,
      onNextDay,
      onToggleWeekView,
      onAutoAssign,
      onNewJob,
      onRefresh,
      onShowShortcuts,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
