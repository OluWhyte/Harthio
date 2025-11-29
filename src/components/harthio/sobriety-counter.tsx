'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { sobrietyService, type SobrietyTracker, type TimeBreakdown } from '@/lib/sobriety-service';
import { EditTrackerDialog } from './edit-tracker-dialog';
import { DeleteTrackerDialog } from './delete-tracker-dialog';

interface SobrietyCounterProps {
  trackers: SobrietyTracker[];
  onReset?: (trackerId: string) => void;
  onTrackerUpdated?: () => void;
  hasBackground?: boolean; // Whether there's a dark background image
}

export function SobrietyCounter({ trackers, onReset, onTrackerUpdated, hasBackground = true }: SobrietyCounterProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeBreakdowns, setTimeBreakdowns] = useState<Record<string, TimeBreakdown>>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [editingTracker, setEditingTracker] = useState<SobrietyTracker | null>(null);
  const [deletingTracker, setDeletingTracker] = useState<SobrietyTracker | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Update time every second
  useEffect(() => {
    const updateTimes = () => {
      const newBreakdowns: Record<string, TimeBreakdown> = {};
      trackers.forEach(tracker => {
        newBreakdowns[tracker.id] = sobrietyService.calculateTimeBreakdown(tracker.start_date);
      });
      setTimeBreakdowns(newBreakdowns);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, [trackers]);

  // Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrevious();
    }
  };

  if (trackers.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <Trophy className={`h-16 w-16 mx-auto ${hasBackground ? 'text-white/40 drop-shadow-lg' : 'text-primary/40'}`} />
        <div>
          <h3 className={`font-semibold text-lg mb-2 ${hasBackground ? 'text-white/90 drop-shadow' : 'text-foreground'}`}>
            Start Your Journey
          </h3>
          <p className={`text-sm ${hasBackground ? 'text-white/70 drop-shadow' : 'text-muted-foreground'}`}>
            Track your progress and celebrate every milestone
          </p>
        </div>
      </div>
    );
  }

  const currentTracker = trackers[currentIndex];
  const breakdown = timeBreakdowns[currentTracker?.id];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? trackers.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === trackers.length - 1 ? 0 : prev + 1));
  };

  const getTrackerEmoji = (type: string) => {
    switch (type) {
      case 'alcohol': return '🍺';
      case 'smoking': return '🚬';
      case 'drugs': return '💊';
      case 'gambling': return '🎰';
      case 'vaping': return '💨';
      case 'food': return '🍔';
      case 'shopping': return '🛍️';
      case 'gaming': return '🎮';
      case 'pornography': return '🔞';
      case 'other': return '🎯';
      default: return '🎯';
    }
  };

  const getTrackerColor = (type: string) => {
    switch (type) {
      case 'alcohol': return 'from-blue-500/10 to-blue-600/10 border-blue-500/20';
      case 'smoking': return 'from-orange-500/10 to-orange-600/10 border-orange-500/20';
      case 'drugs': return 'from-purple-500/10 to-purple-600/10 border-purple-500/20';
      case 'gambling': return 'from-red-500/10 to-red-600/10 border-red-500/20';
      case 'vaping': return 'from-gray-500/10 to-gray-600/10 border-gray-500/20';
      case 'food': return 'from-yellow-500/10 to-yellow-600/10 border-yellow-500/20';
      case 'shopping': return 'from-pink-500/10 to-pink-600/10 border-pink-500/20';
      case 'gaming': return 'from-indigo-500/10 to-indigo-600/10 border-indigo-500/20';
      case 'pornography': return 'from-rose-500/10 to-rose-600/10 border-rose-500/20';
      case 'other': return 'from-green-500/10 to-green-600/10 border-green-500/20';
      default: return 'from-green-500/10 to-green-600/10 border-green-500/20';
    }
  };

  if (!breakdown) return null;

  return (
    <div className="space-y-3 relative">
      {/* Edge Navigation Arrows - Desktop Only */}
      {trackers.length > 1 && (
        <>
          {/* Left Arrow - Hidden on mobile */}
          <button
            onClick={handlePrevious}
            className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 transition-all hover:scale-110 active:scale-95"
            aria-label="Previous tracker"
          >
            <ChevronLeft className={`h-8 w-8 ${hasBackground ? 'text-white drop-shadow-lg' : 'text-foreground'}`} />
          </button>

          {/* Right Arrow - Hidden on mobile */}
          <button
            onClick={handleNext}
            className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 transition-all hover:scale-110 active:scale-95"
            aria-label="Next tracker"
          >
            <ChevronRight className={`h-8 w-8 ${hasBackground ? 'text-white drop-shadow-lg' : 'text-foreground'}`} />
          </button>
        </>
      )}

      {/* Carousel Container - Swipeable */}
      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTouchStart={trackers.length > 1 ? onTouchStart : undefined}
          onTouchMove={trackers.length > 1 ? onTouchMove : undefined}
          onTouchEnd={trackers.length > 1 ? onTouchEnd : undefined}
        >
          {trackers.map((tracker, index) => {
            const breakdown = timeBreakdowns[tracker.id];
            if (!breakdown) return null;
            
            return (
              <div key={tracker.id} className="w-full flex-shrink-0 p-4 md:p-6">
                {/* Header - Left Aligned - Responsive spacing */}
                <div className="flex items-start gap-2 md:gap-3 mb-4 md:mb-6">
                  <span className="text-4xl drop-shadow-lg">{getTrackerEmoji(tracker.tracker_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-lg truncate ${hasBackground ? 'text-white drop-shadow-lg' : 'text-foreground'}`}>{tracker.tracker_name}</h3>
                        <p className={`text-sm ${hasBackground ? 'text-white/80 drop-shadow' : 'text-muted-foreground'}`}>
                          {breakdown.totalDays} {breakdown.totalDays === 1 ? 'day' : 'days'} strong
                        </p>
                        {/* Counter indicator - Desktop only */}
                        {trackers.length > 1 && (
                          <p className={`hidden md:block text-xs mt-0.5 ${hasBackground ? 'text-white/60 drop-shadow' : 'text-muted-foreground'}`}>
                            {index + 1} of {trackers.length}
                          </p>
                        )}
                      </div>
                      {/* Management Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${hasBackground ? 'text-white hover:bg-white/10' : ''}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Tracker options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingTracker(tracker)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Tracker
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onReset?.(tracker.id)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset Counter
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeletingTracker(tracker)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Tracker
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {/* Milestone Badge - Highest Achievement */}
                      <div className="flex-shrink-0">
                        {breakdown.totalDays >= 365 ? (
                          <span className="text-xs px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30 drop-shadow whitespace-nowrap">
                            👑 1 Year
                          </span>
                        ) : breakdown.totalDays >= 90 ? (
                          <span className="text-xs px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30 drop-shadow whitespace-nowrap">
                            🏆 90 Days
                          </span>
                        ) : breakdown.totalDays >= 30 ? (
                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                            hasBackground 
                              ? 'bg-white/20 backdrop-blur-sm text-white border border-white/30 drop-shadow'
                              : 'bg-primary/10 text-primary border border-primary/20'
                          }`}>
                            🎉 1 Month
                          </span>
                        ) : breakdown.totalDays >= 7 ? (
                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                            hasBackground 
                              ? 'bg-white/20 backdrop-blur-sm text-white border border-white/30 drop-shadow'
                              : 'bg-primary/10 text-primary border border-primary/20'
                          }`}>
                            🌟 1 Week
                          </span>
                        ) : breakdown.totalDays >= 1 ? (
                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                            hasBackground 
                              ? 'bg-white/20 backdrop-blur-sm text-white border border-white/30 drop-shadow'
                              : 'bg-primary/10 text-primary border border-primary/20'
                          }`}>
                            ✨ 1 Day
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Counter */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold tabular-nums ${hasBackground ? 'text-white drop-shadow-lg' : 'text-foreground'}`}>{breakdown.months}</div>
                    <div className={`text-xs ${hasBackground ? 'text-white/70 drop-shadow' : 'text-muted-foreground'}`}>Months</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold tabular-nums ${hasBackground ? 'text-white drop-shadow-lg' : 'text-foreground'}`}>{breakdown.days}</div>
                    <div className={`text-xs ${hasBackground ? 'text-white/70 drop-shadow' : 'text-muted-foreground'}`}>Days</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold tabular-nums ${hasBackground ? 'text-white drop-shadow-lg' : 'text-foreground'}`}>{breakdown.hours}</div>
                    <div className={`text-xs ${hasBackground ? 'text-white/70 drop-shadow' : 'text-muted-foreground'}`}>Hours</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold tabular-nums ${hasBackground ? 'text-white drop-shadow-lg' : 'text-foreground'}`}>{breakdown.minutes}</div>
                    <div className={`text-xs ${hasBackground ? 'text-white/70 drop-shadow' : 'text-muted-foreground'}`}>Mins</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold tabular-nums ${hasBackground ? 'text-white drop-shadow-lg' : 'text-foreground'}`}>{breakdown.seconds}</div>
                    <div className={`text-xs ${hasBackground ? 'text-white/70 drop-shadow' : 'text-muted-foreground'}`}>Secs</div>
                  </div>
                </div>




              </div>
            );
          })}
        </div>
      </div>

      {/* Dots indicator for multiple trackers */}
      {trackers.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {trackers.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Edit Tracker Dialog */}
      {editingTracker && (
        <EditTrackerDialog
          tracker={editingTracker}
          open={!!editingTracker}
          onOpenChange={(open) => !open && setEditingTracker(null)}
          onTrackerUpdated={() => {
            setEditingTracker(null);
            onTrackerUpdated?.();
          }}
        />
      )}

      {/* Delete Tracker Dialog */}
      {deletingTracker && (
        <DeleteTrackerDialog
          tracker={deletingTracker}
          open={!!deletingTracker}
          onOpenChange={(open) => !open && setDeletingTracker(null)}
          onTrackerDeleted={() => {
            setDeletingTracker(null);
            onTrackerUpdated?.();
          }}
        />
      )}
    </div>
  );
}
