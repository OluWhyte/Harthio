'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { UserTier } from '@/lib/services/tier-service';

interface RateLimitDisplayProps {
  remaining: number;
  limit: number;
  userTier: UserTier;
  type?: 'message' | 'topic_helper';
  compact?: boolean;
}

export function RateLimitDisplay({ 
  remaining, 
  limit, 
  userTier,
  type = 'message',
  compact = false
}: RateLimitDisplayProps) {
  const router = useRouter();

  // Don't show for Pro users
  if (userTier === 'pro') return null;

  const percentage = (remaining / limit) * 100;
  const isLow = percentage <= 33;
  const isOut = remaining === 0;

  const typeLabel = type === 'message' ? 'message' : 'topic helper';
  const typeLabelPlural = type === 'message' ? 'messages' : 'topic helpers';

  if (compact) {
    return (
      <div className="text-xs text-center py-2">
        <span className={isLow ? 'text-orange-500' : 'text-muted-foreground'}>
          💙 {remaining} of {limit} free {typeLabelPlural} remaining today
        </span>
      </div>
    );
  }

  if (isOut) {
    return (
      <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 space-y-3">
        <div className="space-y-1">
          <p className="font-medium text-sm">
            You've used your {limit} free {typeLabelPlural} today! 💙
          </p>
          <p className="text-xs text-muted-foreground">
            Your {typeLabelPlural} reset tomorrow at midnight.
          </p>
        </div>
        <Button
          onClick={() => router.push('/upgrade?trial=true')}
          size="sm"
          className="w-full"
        >
          Upgrade to Pro for Unlimited
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Free Tier Usage
        </span>
        <span className={`text-sm font-semibold ${isLow ? 'text-orange-500' : 'text-primary'}`}>
          {remaining}/{limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            isLow ? 'bg-orange-500' : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {remaining} {remaining === 1 ? typeLabel : typeLabelPlural} remaining today. 
        {isLow && ' Upgrade to Pro for unlimited access!'}
      </p>

      {isLow && (
        <Button
          onClick={() => router.push('/upgrade?trial=true')}
          size="sm"
          variant="outline"
          className="w-full"
        >
          Start 14-Day Free Trial
        </Button>
      )}
    </div>
  );
}
