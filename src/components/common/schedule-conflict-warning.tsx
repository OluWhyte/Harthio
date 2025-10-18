'use client';

import { AlertTriangle, Clock, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { ConflictCheckResult } from '@/lib/schedule-conflict-detector';

interface ScheduleConflictWarningProps {
  conflictResult: ConflictCheckResult;
  className?: string;
}

export function ScheduleConflictWarning({ conflictResult, className }: ScheduleConflictWarningProps) {
  if (!conflictResult.hasConflict || !conflictResult.conflictingSessions) {
    return null;
  }

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">Schedule Conflict</p>
          <p className="text-sm">{conflictResult.reason}</p>
          
          {conflictResult.conflictingSessions.map((session, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-destructive/10 rounded border">
              <Calendar className="h-3 w-3" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.sessionTitle}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                </div>
              </div>
              <Badge variant="destructive" className="text-xs">
                Conflict
              </Badge>
            </div>
          ))}
          
          <p className="text-xs text-muted-foreground mt-2">
            Please choose a different time or date to avoid conflicts.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}