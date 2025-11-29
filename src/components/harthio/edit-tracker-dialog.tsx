'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { sobrietyService, type SobrietyTracker } from '@/lib/sobriety-service';
import { useToast } from '@/hooks/use-toast';

interface EditTrackerDialogProps {
  tracker: SobrietyTracker;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTrackerUpdated: () => void;
}

export function EditTrackerDialog({ 
  tracker, 
  open, 
  onOpenChange, 
  onTrackerUpdated 
}: EditTrackerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackerName, setTrackerName] = useState(tracker.tracker_name);
  const [notes, setNotes] = useState(tracker.notes || '');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackerName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your tracker.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const result = await sobrietyService.updateTracker(tracker.id, {
      tracker_name: trackerName.trim(),
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Tracker Updated! ✅',
        description: 'Your changes have been saved.',
      });
      onOpenChange(false);
      onTrackerUpdated();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update tracker.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Tracker</DialogTitle>
            <DialogDescription>
              Update your tracker name and notes. Type and start date cannot be changed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Tracker Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Tracker Name</Label>
              <Input
                id="name"
                placeholder="e.g., Alcohol Free"
                value={trackerName}
                onChange={(e) => setTrackerName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground text-right">
                {trackerName.length}/50
              </p>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Why is this important to you?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {notes.length}/200
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
