"use client";

import { useState, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';
import GridLayout, { LayoutItem, getCompactor } from 'react-grid-layout';
import { Pencil, Check, GripVertical, RotateCcw } from 'lucide-react';
import 'react-grid-layout/css/styles.css';

// Create a vertical compactor that prevents collision (no overlapping)
const verticalNoOverlapCompactor = getCompactor('vertical', false, false);

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

// Size presets
const SIZE_PRESETS = {
  S: { w: 3, h: 3, label: 'Small' },
  M: { w: 6, h: 4, label: 'Medium' },
  L: { w: 6, h: 6, label: 'Large' },
  F: { w: 12, h: 4, label: 'Full Width' },
};

export default function CustomizableDashboard({
  widgets,
  defaultLayout,
  storageKey,
  className = '',
}: CustomizableDashboardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<LayoutItem[]>(defaultLayout);
  const [mounted, setMounted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0); // Start at 0 to force recalculate
  const [widthReady, setWidthReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container width - runs after mount
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.offsetWidth;
        if (newWidth > 0) {
          setContainerWidth(newWidth);
          setWidthReady(true);
        }
      }
    };

    // Initial calculation with small delay to ensure DOM is ready
    const initialTimer = setTimeout(() => {
      updateWidth();
    }, 50);

    // Second calculation to catch any layout shifts
    const secondTimer = setTimeout(() => {
      updateWidth();
    }, 150);

    window.addEventListener('resize', updateWidth);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(secondTimer);
      window.removeEventListener('resize', updateWidth);
    };
  }, [mounted]); // Re-run when mounted changes

  // Load saved layout from localStorage
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: LayoutItem[] = JSON.parse(saved);
        const validIds = new Set(widgets.map(w => w.id));
        const validLayout = parsed.filter(item => validIds.has(item.i));

        if (validLayout.length === widgets.length) {
          setLayout(validLayout);
        }
      } catch (e) {
        console.error('Failed to parse saved layout:', e);
      }
    }
  }, [storageKey, widgets]);

  // Save layout to localStorage
  const saveLayout = useCallback((newLayout: LayoutItem[]) => {
    localStorage.setItem(storageKey, JSON.stringify(newLayout));
  }, [storageKey]);

  // Handle layout change from drag/resize
  const handleLayoutChange = useCallback((newLayout: readonly LayoutItem[]) => {
    const mutableLayout = [...newLayout];
    setLayout(mutableLayout);
    if (isEditMode) {
      saveLayout(mutableLayout);
    }
  }, [isEditMode, saveLayout]);

  // Toggle edit mode
  const handleEditToggle = () => {
    if (isEditMode) {
      saveLayout(layout);
    }
    setIsEditMode(!isEditMode);
  };

  // Reset to default layout
  const resetLayout = () => {
    setLayout(defaultLayout);
    saveLayout(defaultLayout);
  };

  // Change widget size using presets
  const setWidgetSize = (widgetId: string, preset: keyof typeof SIZE_PRESETS) => {
    const size = SIZE_PRESETS[preset];
    setLayout(prev => {
      const newLayout = prev.map(item => {
        if (item.i === widgetId) {
          return {
            ...item,
            w: size.w,
            h: size.h,
          };
        }
        return item;
      });
      saveLayout(newLayout);
      return newLayout;
    });
  };

  // Get widget from layout
  const getWidgetLayout = (id: string) => layout.find(l => l.i === id);

  // Calculate grid content height to prevent infinite scroll
  const gridContentHeight = useMemo(() => {
    if (layout.length === 0) return 400;
    const rowHeight = 80;
    const margin = 16;
    // Find the bottom-most widget
    const maxBottom = Math.max(...layout.map(item => item.y + item.h));
    // Calculate total height: rows * rowHeight + margins + padding
    return (maxBottom * (rowHeight + margin)) + 50; // 50px extra padding
  }, [layout]);

  // Show loading skeleton until both mounted and width is calculated
  if (!mounted || !widthReady) {
    return (
      <div className={`relative ${className}`} ref={containerRef}>
        <div className="animate-pulse space-y-4">
          {widgets.slice(0, 3).map((widget) => (
            <div key={widget.id} className="bg-card rounded-2xl h-64 border border-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Edit Mode Controls */}
      <div className="flex items-center justify-end gap-2 mb-4">
        {isEditMode && (
          <button
            onClick={resetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-all border border-border"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Layout
          </button>
        )}
        <button
          onClick={handleEditToggle}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            isEditMode
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
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

      {/* Edit Mode Instructions */}
      {isEditMode && (
        <div className="mb-4 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary">
          <span className="font-semibold">Edit Mode:</span> Drag the handle to move widgets. Drag corners to resize. Use S/M/L/F buttons for quick sizing.
        </div>
      )}

      {/* Grid Layout - constrained height prevents infinite scroll */}
      <div style={{ minHeight: gridContentHeight, maxHeight: isEditMode ? gridContentHeight : undefined }}>
        <GridLayout
          className="layout"
          layout={layout}
          width={containerWidth}
          autoSize={false}
          style={{ height: gridContentHeight }}
          gridConfig={{
            cols: 12,
            rowHeight: 80,
            margin: [16, 16] as const,
            containerPadding: [0, 0] as const,
            maxRows: Infinity,
          }}
          dragConfig={{
            enabled: isEditMode,
            handle: '.widget-drag-handle',
            bounded: false,
            threshold: 3,
          }}
          resizeConfig={{
            enabled: isEditMode,
            handles: ['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne'],
          }}
          compactor={verticalNoOverlapCompactor}
          onLayoutChange={handleLayoutChange}
        >
        {widgets.map((widget) => {
          const widgetLayout = getWidgetLayout(widget.id);

          return (
            <div
              key={widget.id}
              className={`widget-container relative transition-all duration-200 ${
                isEditMode
                  ? 'ring-2 ring-primary/20 ring-offset-2 ring-offset-background rounded-2xl hover:ring-primary/40'
                  : ''
              }`}
            >
              {/* Edit Mode Overlay with Controls */}
              {isEditMode && (
                <>
                  {/* Drag Handle */}
                  <div className="widget-drag-handle absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg cursor-grab active:cursor-grabbing hover:bg-primary/90 transition-all select-none">
                    <GripVertical className="h-4 w-4" />
                    <span className="text-xs font-semibold">{widget.title}</span>
                  </div>

                  {/* Size Preset Buttons */}
                  <div className="absolute top-3 right-3 z-30 flex gap-1">
                    {(Object.keys(SIZE_PRESETS) as Array<keyof typeof SIZE_PRESETS>).map((key) => {
                      const preset = SIZE_PRESETS[key];
                      const isActive = widgetLayout?.w === preset.w && widgetLayout?.h === preset.h;
                      return (
                        <button
                          key={key}
                          onClick={() => setWidgetSize(widget.id, key)}
                          title={preset.label}
                          className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-md transition-all ${
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {key}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Widget Content */}
              <div className="h-full w-full overflow-hidden">
                {widget.component}
              </div>
            </div>
          );
        })}
        </GridLayout>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }

        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }

        .react-grid-item.resizing {
          z-index: 10;
        }

        .react-grid-item.react-draggable-dragging {
          z-index: 100;
          opacity: 0.95;
          box-shadow: 0 20px 40px -12px rgb(0 0 0 / 0.3);
        }

        /* Base resize handle styles - minimalistic */
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          opacity: 0;
          transition: opacity 150ms ease;
          z-index: 20;
        }

        .react-grid-item:hover > .react-resizable-handle,
        .react-grid-item.resizing > .react-resizable-handle {
          opacity: 1;
        }

        /* Corner handles - clean teal L-shapes pointing OUTWARD */
        /* Bottom-right corner ↘ - L opens toward bottom-right */
        .react-grid-item > .react-resizable-handle-se {
          width: 16px;
          height: 16px;
          bottom: 2px;
          right: 2px;
          cursor: se-resize;
        }
        .react-grid-item > .react-resizable-handle-se::after {
          content: '';
          position: absolute;
          right: 0;
          bottom: 0;
          width: 12px;
          height: 12px;
          border-right: 2px solid #14b8a6;
          border-bottom: 2px solid #14b8a6;
        }

        /* Bottom-left corner ↙ - L opens toward bottom-left */
        .react-grid-item > .react-resizable-handle-sw {
          width: 16px;
          height: 16px;
          bottom: 2px;
          left: 2px;
          cursor: sw-resize;
        }
        .react-grid-item > .react-resizable-handle-sw::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 12px;
          height: 12px;
          border-left: 2px solid #14b8a6;
          border-bottom: 2px solid #14b8a6;
        }

        /* Top-left corner ↖ - L opens toward top-left */
        .react-grid-item > .react-resizable-handle-nw {
          width: 16px;
          height: 16px;
          top: 2px;
          left: 2px;
          cursor: nw-resize;
        }
        .react-grid-item > .react-resizable-handle-nw::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 12px;
          height: 12px;
          border-left: 2px solid #14b8a6;
          border-top: 2px solid #14b8a6;
        }

        /* Top-right corner ↗ - L opens toward top-right */
        .react-grid-item > .react-resizable-handle-ne {
          width: 16px;
          height: 16px;
          top: 2px;
          right: 2px;
          cursor: ne-resize;
        }
        .react-grid-item > .react-resizable-handle-ne::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          width: 12px;
          height: 12px;
          border-right: 2px solid #14b8a6;
          border-top: 2px solid #14b8a6;
        }

        /* Edge handles - invisible but functional */
        .react-grid-item > .react-resizable-handle-e {
          width: 8px;
          height: calc(100% - 32px);
          right: 0;
          top: 16px;
          cursor: e-resize;
        }

        .react-grid-item > .react-resizable-handle-w {
          width: 8px;
          height: calc(100% - 32px);
          left: 0;
          top: 16px;
          cursor: w-resize;
        }

        .react-grid-item > .react-resizable-handle-n {
          width: calc(100% - 32px);
          height: 8px;
          top: 0;
          left: 16px;
          cursor: n-resize;
        }

        .react-grid-item > .react-resizable-handle-s {
          width: calc(100% - 32px);
          height: 8px;
          bottom: 0;
          left: 16px;
          cursor: s-resize;
        }

        .react-grid-placeholder {
          background: rgba(20, 184, 166, 0.15);
          border: 2px dashed rgba(20, 184, 166, 0.4);
          border-radius: 16px;
          transition: all 200ms ease;
        }

        .widget-drag-handle:active {
          cursor: grabbing;
        }

        .react-grid-item:not(.react-draggable-dragging) {
          will-change: auto;
        }

        .react-grid-item.react-draggable-dragging {
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
