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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { sobrietyService, type TrackerType } from '@/lib/sobriety-service';
import { useToast } from '@/hooks/use-toast';

interface AddTrackerDialogProps {
  userId: string;
  onTrackerAdded: () => void;
  children: React.ReactNode;
}

const trackerTypes = [
  { value: 'alcohol', label: 'Alcohol Free', emoji: '🍺' },
  { value: 'smoking', label: 'Smoke Free', emoji: '🚬' },
  { value: 'drugs', label: 'Drug Free', emoji: '💊' },
  { value: 'gambling', label: 'Gambling Free', emoji: '🎰' },
  { value: 'other', label: 'Other', emoji: '🎯' },
];

export function AddTrackerDialog({ userId, onTrackerAdded, children }: AddTrackerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackerType, setTrackerType] = useState<TrackerType>('alcohol');
  const [trackerName, setTrackerName] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
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

    const result = await sobrietyService.createTracker(
      userId,
      trackerType,
      trackerName.trim(),
      startDate,
      (notes.trim() || undefined) as any
    );

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Tracker Created! 🎉',
        description: `Your ${trackerName} tracker is now active.`,
      });
      setOpen(false);
      onTrackerAdded();
      
      // Reset form
      setTrackerType('alcohol');
      setTrackerName('');
      setStartDate(new Date());
      setNotes('');
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to create tracker.',
        variant: 'destructive',
      });
    }
  };

  // Auto-fill tracker name based on type
  const handleTypeChange = (value: TrackerType) => {
    setTrackerType(value);
    const selected = trackerTypes.find(t => t.value === value);
    if (selected && !trackerName) {
      setTrackerName(selected.label);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Recovery Tracker</DialogTitle>
            <DialogDescription>
              Track your progress and celebrate your milestones.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Tracker Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">What are you tracking?</Label>
              <Select value={trackerType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trackerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <span>{type.emoji}</span>
                        <span>{type.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {/* Start Date */}
            <div className="grid gap-2">
              <Label>When did you start?</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes (Optional) */}
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
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Tracker'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
