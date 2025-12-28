"use client";

import { useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Pencil, Check, GripVertical, RotateCcw } from 'lucide-react';

export interface DashboardWidget {
  id: string;
  title: string;
  component: ReactNode;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface DashboardLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

interface CustomizableDashboardProps {
  widgets: DashboardWidget[];
  defaultLayout: DashboardLayoutItem[];
  storageKey: string;
  className?: string;
}

export default function CustomizableDashboard({
  widgets,
  defaultLayout,
  storageKey,
  className = '',
}: CustomizableDashboardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<DashboardLayoutItem[]>(defaultLayout);
  const [mounted, setMounted] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Load saved layout from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedLayout = localStorage.getItem(storageKey);
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        const savedIds = new Set(parsed.map((l: DashboardLayoutItem) => l.i));
        const currentWidgetIds = widgets.map(w => w.id);

        if (currentWidgetIds.every(id => savedIds.has(id))) {
          const mergedLayout = parsed.map((item: DashboardLayoutItem) => {
            const widget = widgets.find(w => w.id === item.i);
            return {
              ...item,
              minW: widget?.minW ?? item.minW,
              minH: widget?.minH ?? item.minH,
              maxW: widget?.maxW ?? item.maxW,
              maxH: widget?.maxH ?? item.maxH,
            };
          });
          setLayout(mergedLayout);
        }
      } catch (e) {
        console.error('Failed to parse saved layout:', e);
      }
    }
  }, [storageKey, widgets]);

  const saveLayout = useCallback((newLayout: DashboardLayoutItem[]) => {
    localStorage.setItem(storageKey, JSON.stringify(newLayout));
  }, [storageKey]);

  const handleEditToggle = () => {
    if (isEditMode) {
      saveLayout(layout);
    }
    setIsEditMode(!isEditMode);
  };

  const resetLayout = () => {
    setLayout(defaultLayout);
    saveLayout(defaultLayout);
  };

  // Move widget up or down in the layout order
  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    const currentIndex = layout.findIndex(l => l.i === widgetId);
    if (currentIndex === -1) return;

    const newLayout = [...layout];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= newLayout.length) return;

    // Swap positions
    const temp = newLayout[currentIndex];
    newLayout[currentIndex] = newLayout[targetIndex];
    newLayout[targetIndex] = temp;

    // Update y positions to reflect new order
    let currentY = 0;
    newLayout.forEach((item, index) => {
      item.y = currentY;
      currentY += item.h;
    });

    setLayout(newLayout);
    saveLayout(newLayout);
  };

  if (!mounted) {
    return (
      <div className={`relative ${className}`}>
        <div className="animate-pulse space-y-4">
          {widgets.slice(0, 3).map((widget) => (
            <div key={widget.id} className="bg-card rounded-2xl h-64 border border-border" />
          ))}
        </div>
      </div>
    );
  }

  // Sort widgets by their y position for proper vertical order
  const sortedLayout = [...layout].sort((a, b) => a.y - b.y);

  return (
    <div className={`relative ${className}`} ref={gridRef}>
      {/* Edit Mode Toggle Button */}
      <div className="flex items-center justify-end gap-2 mb-4">
        {isEditMode && (
          <button
            onClick={resetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors border border-border"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Layout
          </button>
        )}
        <button
          onClick={handleEditToggle}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            isEditMode
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          {isEditMode ? (
            <>
              <Check className="h-4 w-4" />
              Done
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4" />
              Customize
            </>
          )}
        </button>
      </div>

      {/* Instructions when in edit mode */}
      {isEditMode && (
        <div className="mb-4 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary">
          <span className="font-medium">Edit Mode:</span> Use the arrow buttons to reorder widgets. Click Done when finished.
        </div>
      )}

      {/* Grid Layout using CSS Grid with stacked layout for simplicity */}
      <div className="space-y-4">
        {sortedLayout.map((item, index) => {
          const widget = widgets.find(w => w.id === item.i);
          if (!widget) return null;

          // Calculate min-height based on h value (each h unit = 80px)
          const minHeight = item.h * 80;

          return (
            <div
              key={item.i}
              className={`relative ${
                isEditMode
                  ? 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background rounded-2xl'
                  : ''
              }`}
              style={{ minHeight: `${minHeight}px` }}
            >
              {/* Edit Controls - Only visible in edit mode */}
              {isEditMode && (
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1.5 bg-primary text-primary-foreground rounded-lg shadow-md">
                    <GripVertical className="h-4 w-4" />
                    <span className="text-xs font-medium">{widget.title}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveWidget(item.i, 'up')}
                      disabled={index === 0}
                      className={`p-1.5 rounded-lg transition-colors ${
                        index === 0
                          ? 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                      }`}
                      title="Move up"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveWidget(item.i, 'down')}
                      disabled={index === sortedLayout.length - 1}
                      className={`p-1.5 rounded-lg transition-colors ${
                        index === sortedLayout.length - 1
                          ? 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                      }`}
                      title="Move down"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Widget Content */}
              <div className="h-full w-full">
                {widget.component}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
