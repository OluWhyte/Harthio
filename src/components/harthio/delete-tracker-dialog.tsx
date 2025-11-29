'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import { sobrietyService, type SobrietyTracker } from '@/lib/sobriety-service';
import { useToast } from '@/hooks/use-toast';

interface DeleteTrackerDialogProps {
  tracker: SobrietyTracker;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTrackerDeleted: () => void;
}

export function DeleteTrackerDialog({ 
  tracker, 
  open, 
  onOpenChange, 
  onTrackerDeleted 
}: DeleteTrackerDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await sobrietyService.deactivateTracker(tracker.id);

    setIsDeleting(false);

    if (result.success) {
      toast({
        title: 'Tracker Deleted',
        description: 'Your tracker has been removed.',
      });
      onOpenChange(false);
      onTrackerDeleted();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete tracker.',
        variant: 'destructive',
      });
    }
  };

  const breakdown = sobrietyService.calculateTimeBreakdown(tracker.start_date);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Tracker?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <strong>{tracker.tracker_name}</strong>?
            </p>
            <p className="text-sm">
              You've been tracking for <strong>{breakdown.totalDays} days</strong>. 
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Tracker'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
