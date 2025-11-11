'use client'

import { useState, useEffect, useRef } from 'react';
import { MoreVertical, Edit2, Clock, CheckCircle, XCircle, Trash2, ChevronRight } from 'lucide-react';

interface Job {
  id: string;
  status: string;
  [key: string]: any;
}

interface JobCardContextMenuProps {
  job: Job;
  onStatusChange: (status: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function JobCardContextMenu({ job, onStatusChange, onEdit, onDelete }: JobCardContextMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showStatusSubmenu, setShowStatusSubmenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const statuses = [
    { value: 'scheduled', label: 'Scheduled', icon: Clock, color: 'text-blue-400' },
    { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-orange-400' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-emerald-400' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-400' },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false);
        setShowStatusSubmenu(false);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(`[data-job-id="${job.id}"]`)) {
        e.preventDefault();
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setShowMenu(true);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [showMenu, job.id]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPosition({
        x: rect.left,
        y: rect.bottom + 4,
      });
    }
    setShowMenu(!showMenu);
  };

  const handleStatusClick = (status: string) => {
    if (status !== job.status) {
      onStatusChange(status);
    }
    setShowMenu(false);
    setShowStatusSubmenu(false);
  };

  return (
    <div className="relative">
      {/* Three-dot button */}
      <button
        ref={buttonRef}
        onClick={handleMenuClick}
        className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 rounded transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {/* Context Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="fixed bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-[60] min-w-[180px]"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
          }}
        >
          {/* Change Status with Submenu */}
          <div
            className="relative"
            onMouseEnter={() => setShowStatusSubmenu(true)}
            onMouseLeave={() => setShowStatusSubmenu(false)}
          >
            <button
              className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Change Status</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Status Submenu */}
            {showStatusSubmenu && (
              <div className="absolute left-full top-0 ml-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden min-w-[160px]">
                {statuses.map((status) => {
                  const StatusIcon = status.icon;
                  const isCurrentStatus = status.value === job.status;
                  return (
                    <button
                      key={status.value}
                      onClick={() => handleStatusClick(status.value)}
                      disabled={isCurrentStatus}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                        isCurrentStatus
                          ? 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
                          : 'text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      <StatusIcon className={`h-4 w-4 ${isCurrentStatus ? 'text-zinc-500' : status.color}`} />
                      <span>{status.label}</span>
                      {isCurrentStatus && (
                        <span className="ml-auto text-xs text-zinc-600">Current</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-700" />

          {/* Edit Job */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            <span>Edit Job</span>
          </button>

          <div className="border-t border-zinc-700" />

          {/* Delete Job */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this job?')) {
                onDelete();
              }
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Job</span>
          </button>
        </div>
      )}
    </div>
  );
}
