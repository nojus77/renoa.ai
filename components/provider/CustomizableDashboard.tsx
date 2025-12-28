"use client";

import { useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragMoveEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Resizable } from 're-resizable';
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

interface WidgetPosition {
  id: string;
  order: number;
  height: number;
}

interface CustomizableDashboardProps {
  widgets: DashboardWidget[];
  defaultLayout: DashboardLayoutItem[];
  storageKey: string;
  className?: string;
}

// Sortable Widget Component
function SortableWidget({
  id,
  title,
  children,
  isEditMode,
  height,
  onHeightChange,
  minHeight = 200,
}: {
  id: string;
  title: string;
  children: ReactNode;
  isEditMode: boolean;
  height: number;
  onHeightChange: (id: string, height: number) => void;
  minHeight?: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${
        isEditMode
          ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background rounded-2xl'
          : ''
      } ${isDragging ? 'shadow-2xl' : ''}`}
    >
      {isEditMode ? (
        <Resizable
          size={{ width: '100%', height }}
          minHeight={minHeight}
          maxHeight={800}
          enable={{
            top: false,
            right: false,
            bottom: true,
            left: false,
            topRight: false,
            bottomRight: true,
            bottomLeft: true,
            topLeft: false,
          }}
          onResizeStop={(e, direction, ref, d) => {
            onHeightChange(id, height + d.height);
          }}
          handleStyles={{
            bottom: {
              height: '12px',
              bottom: '-6px',
              cursor: 'ns-resize',
            },
            bottomRight: {
              width: '16px',
              height: '16px',
              right: '4px',
              bottom: '4px',
              cursor: 'nwse-resize',
            },
            bottomLeft: {
              width: '16px',
              height: '16px',
              left: '4px',
              bottom: '4px',
              cursor: 'nesw-resize',
            },
          }}
          handleComponent={{
            bottomRight: (
              <div className="w-4 h-4 bg-primary rounded-sm opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M7 1L1 7M7 4L4 7M7 7H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            ),
            bottomLeft: (
              <div className="w-4 h-4 bg-primary rounded-sm opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 1L7 7M1 4L4 7M1 7H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            ),
          }}
        >
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg cursor-grab active:cursor-grabbing hover:bg-primary/90 transition-all select-none"
          >
            <GripVertical className="h-4 w-4" />
            <span className="text-xs font-semibold">{title}</span>
          </div>

          {/* Widget Content */}
          <div className="h-full w-full pointer-events-none">
            {children}
          </div>
        </Resizable>
      ) : (
        <div style={{ height }} className="w-full">
          {children}
        </div>
      )}
    </div>
  );
}

// Drag Overlay Component
function DragOverlayWidget({
  title,
  children,
  height,
}: {
  title: string;
  children: ReactNode;
  height: number;
}) {
  return (
    <div
      className="relative ring-2 ring-primary ring-offset-2 ring-offset-background rounded-2xl shadow-2xl opacity-90"
      style={{ height, width: '100%' }}
    >
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg">
        <GripVertical className="h-4 w-4" />
        <span className="text-xs font-semibold">{title}</span>
      </div>
      <div className="h-full w-full pointer-events-none">
        {children}
      </div>
    </div>
  );
}

export default function CustomizableDashboard({
  widgets,
  defaultLayout,
  storageKey,
  className = '',
}: CustomizableDashboardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Widget positions with order and height
  const [widgetPositions, setWidgetPositions] = useState<WidgetPosition[]>(() => {
    return widgets.map((w, index) => {
      const layoutItem = defaultLayout.find(l => l.i === w.id);
      return {
        id: w.id,
        order: layoutItem?.y ?? index,
        height: (layoutItem?.h ?? 4) * 80,
      };
    }).sort((a, b) => a.order - b.order);
  });

  // Sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Load saved positions from localStorage
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: WidgetPosition[] = JSON.parse(saved);
        const validIds = new Set(widgets.map(w => w.id));
        const validPositions = parsed.filter(p => validIds.has(p.id));

        if (validPositions.length === widgets.length) {
          setWidgetPositions(validPositions.sort((a, b) => a.order - b.order));
        }
      } catch (e) {
        console.error('Failed to parse saved layout:', e);
      }
    }
  }, [storageKey, widgets]);

  // Save positions to localStorage
  const savePositions = useCallback((positions: WidgetPosition[]) => {
    localStorage.setItem(storageKey, JSON.stringify(positions));
  }, [storageKey]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setWidgetPositions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index,
        }));

        savePositions(newItems);
        return newItems;
      });
    }
  };

  // Handle height change
  const handleHeightChange = useCallback((id: string, newHeight: number) => {
    setWidgetPositions((items) => {
      const newItems = items.map((item) =>
        item.id === id ? { ...item, height: Math.max(200, newHeight) } : item
      );
      savePositions(newItems);
      return newItems;
    });
  }, [savePositions]);

  // Toggle edit mode
  const handleEditToggle = () => {
    if (isEditMode) {
      savePositions(widgetPositions);
    }
    setIsEditMode(!isEditMode);
  };

  // Reset layout
  const resetLayout = () => {
    const defaultPositions = widgets.map((w, index) => {
      const layoutItem = defaultLayout.find(l => l.i === w.id);
      return {
        id: w.id,
        order: layoutItem?.y ?? index,
        height: (layoutItem?.h ?? 4) * 80,
      };
    }).sort((a, b) => a.order - b.order);

    setWidgetPositions(defaultPositions);
    savePositions(defaultPositions);
  };

  // Get active widget for overlay
  const activeWidget = activeId ? widgets.find(w => w.id === activeId) : null;
  const activePosition = activeId ? widgetPositions.find(p => p.id === activeId) : null;

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

  return (
    <div className={`relative ${className}`}>
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
        <div className="mb-4 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="font-semibold">Edit Mode:</span> Drag widgets to reorder. Drag corners to resize. Click Done when finished.
        </div>
      )}

      {/* DnD Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgetPositions.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {widgetPositions.map((position) => {
              const widget = widgets.find(w => w.id === position.id);
              if (!widget) return null;

              const layoutItem = defaultLayout.find(l => l.i === position.id);
              const minHeight = (layoutItem?.minH ?? 2) * 80;

              return (
                <SortableWidget
                  key={position.id}
                  id={position.id}
                  title={widget.title}
                  isEditMode={isEditMode}
                  height={position.height}
                  onHeightChange={handleHeightChange}
                  minHeight={minHeight}
                >
                  {widget.component}
                </SortableWidget>
              );
            })}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        }}>
          {activeWidget && activePosition ? (
            <DragOverlayWidget
              title={activeWidget.title}
              height={activePosition.height}
            >
              {activeWidget.component}
            </DragOverlayWidget>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Global Styles */}
      <style jsx global>{`
        .sortable-ghost {
          opacity: 0.4;
        }

        [data-dnd-kit-drag-overlay] {
          cursor: grabbing !important;
        }

        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(var(--primary), 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(var(--primary), 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(var(--primary), 0);
          }
        }
      `}</style>
    </div>
  );
}
