'use client'

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle, UserX, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

interface DeleteMemberDialogProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedMemberId: string) => void;
}

export default function DeleteMemberDialog({
  member,
  isOpen,
  onClose,
  onSuccess,
}: DeleteMemberDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [jobCount, setJobCount] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  // Check if member has jobs when dialog opens
  useEffect(() => {
    if (isOpen && member) {
      checkMemberJobs();
    } else {
      setJobCount(null);
    }
  }, [isOpen, member]);

  const checkMemberJobs = async () => {
    if (!member) return;

    setChecking(true);
    try {
      const providerId = localStorage.getItem('providerId');
      if (!providerId) return;

      // Fetch jobs assigned to this user
      const res = await fetch(`/api/provider/jobs?providerId=${providerId}`);
      const data = await res.json();

      if (res.ok && data.jobs) {
        const assignedJobs = data.jobs.filter((job: { assignedUserIds?: string[] }) =>
          job.assignedUserIds?.includes(member.id)
        );
        setJobCount(assignedJobs.length);
      }
    } catch (error) {
      console.error('Error checking jobs:', error);
      setJobCount(0);
    } finally {
      setChecking(false);
    }
  };

  const handleDelete = async (hardDelete: boolean = false) => {
    if (!member) return;

    setDeleting(true);
    try {
      const providerId = localStorage.getItem('providerId');
      const userId = localStorage.getItem('userId');

      if (!providerId || !userId) {
        toast.error('Not logged in');
        return;
      }

      const url = `/api/provider/team/${member.id}?providerId=${providerId}&userId=${userId}${hardDelete ? '&hard=true' : ''}`;

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to remove team member');
        return;
      }

      toast.success(data.message || 'Team member removed');
      onSuccess(member.id);
      onClose();
    } catch (error) {
      toast.error('Unable to remove. Check your connection.');
    } finally {
      setDeleting(false);
    }
  };

  if (!member) return null;

  const hasJobs = jobCount !== null && jobCount > 0;
  const memberName = `${member.firstName} ${member.lastName}`;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-zinc-950 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            {hasJobs ? 'Deactivate Team Member' : 'Delete Team Member'}
          </AlertDialogTitle>

          {checking ? (
            <div className="flex items-center gap-2 text-zinc-400 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking assigned jobs...
            </div>
          ) : hasJobs ? (
            <AlertDialogDescription className="text-zinc-400 space-y-3">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  <strong>{memberName}</strong> has <strong>{jobCount}</strong> job{jobCount !== 1 ? 's' : ''} assigned.
                </p>
              </div>
              <p>
                This member will be deactivated instead of deleted to preserve job history.
                They will no longer be able to log in, but their past jobs will remain intact.
              </p>
              <p className="text-sm text-zinc-500">
                You can reactivate them later if needed.
              </p>
            </AlertDialogDescription>
          ) : (
            <AlertDialogDescription className="text-zinc-400 space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">
                  Are you sure you want to delete <strong>{memberName}</strong>?
                </p>
              </div>
              <p>
                This member has no jobs assigned and can be permanently deleted.
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel
            onClick={onClose}
            disabled={deleting}
            className="border-zinc-700"
          >
            Cancel
          </AlertDialogCancel>

          {hasJobs ? (
            <AlertDialogAction
              onClick={() => handleDelete(false)}
              disabled={deleting || checking}
              className="bg-yellow-600 hover:bg-yellow-500 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deactivating...
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              )}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              onClick={() => handleDelete(true)}
              disabled={deleting || checking}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
