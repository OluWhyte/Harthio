'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { sobrietyService, type SobrietyTracker, type TimeBreakdown } from '@/lib/sobriety-service';
import { VisualJourneyGrid } from './visual-journey-grid';

interface SobrietyCounterProps {
  trackers: SobrietyTracker[];
  onReset?: (trackerId: string) => void;
}

export function SobrietyCounter({ trackers, onReset }: SobrietyCounterProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeBreakdowns, setTimeBreakdowns] = useState<Record<string, TimeBreakdown>>({});
  const [showVisualJourney, setShowVisualJourney] = useState(false);

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

  if (trackers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-2">No active trackers</p>
          <p className="text-sm text-muted-foreground">
            Start tracking your recovery journey
          </p>
        </CardContent>
      </Card>
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
      default: return '🎯';
    }
  };

  const getTrackerColor = (type: string) => {
    switch (type) {
      case 'alcohol': return 'from-blue-500/10 to-blue-600/10 border-blue-500/20';
      case 'smoking': return 'from-orange-500/10 to-orange-600/10 border-orange-500/20';
      case 'drugs': return 'from-purple-500/10 to-purple-600/10 border-purple-500/20';
      case 'gambling': return 'from-red-500/10 to-red-600/10 border-red-500/20';
      default: return 'from-green-500/10 to-green-600/10 border-green-500/20';
    }
  };

  if (!breakdown) return null;

  return (
    <div className="space-y-3">
      <Card className={`bg-gradient-to-br ${getTrackerColor(currentTracker.tracker_type)}`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{getTrackerEmoji(currentTracker.tracker_type)}</span>
              <div>
                <h3 className="font-bold text-lg">{currentTracker.tracker_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {breakdown.totalDays} {breakdown.totalDays === 1 ? 'day' : 'days'} strong
                </p>
              </div>
            </div>
            {trackers.length > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1}/{trackers.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Real-time Counter */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums">{breakdown.months}</div>
              <div className="text-xs text-muted-foreground">Months</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums">{breakdown.days}</div>
              <div className="text-xs text-muted-foreground">Days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums">{breakdown.hours}</div>
              <div className="text-xs text-muted-foreground">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums">{breakdown.minutes}</div>
              <div className="text-xs text-muted-foreground">Mins</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums">{breakdown.seconds}</div>
              <div className="text-xs text-muted-foreground">Secs</div>
            </div>
          </div>

          {/* Milestones */}
          {breakdown.totalDays > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {breakdown.totalDays >= 1 && (
                <span className="text-xs px-2 py-1 bg-background/50 rounded-full">
                  ✨ 1 Day
                </span>
              )}
              {breakdown.totalDays >= 7 && (
                <span className="text-xs px-2 py-1 bg-background/50 rounded-full">
                  🌟 1 Week
                </span>
              )}
              {breakdown.totalDays >= 30 && (
                <span className="text-xs px-2 py-1 bg-background/50 rounded-full">
                  🎉 1 Month
                </span>
              )}
              {breakdown.totalDays >= 90 && (
                <span className="text-xs px-2 py-1 bg-background/50 rounded-full">
                  🏆 90 Days
                </span>
              )}
              {breakdown.totalDays >= 365 && (
                <span className="text-xs px-2 py-1 bg-background/50 rounded-full">
                  👑 1 Year
                </span>
              )}
            </div>
          )}

          {/* Visual Journey Toggle */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mb-3"
            onClick={() => setShowVisualJourney(!showVisualJourney)}
          >
            {showVisualJourney ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Visual Journey
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show Visual Journey
              </>
            )}
          </Button>

          {/* Visual Journey Grid */}
          {showVisualJourney && (
            <div className="mb-4">
              <VisualJourneyGrid
                daysSober={breakdown.totalDays}
                chosenImage={(currentTracker.chosen_image as 'bridge' | 'phoenix' | 'mountain') || 'bridge'}
              />
            </div>
          )}

          {/* Reset Button */}
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onReset(currentTracker.id)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Counter
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Dots indicator for multiple trackers */}
      {trackers.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {trackers.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
