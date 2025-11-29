'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { creditsService, type CreditBalance } from '@/lib/services/credits-service';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function CreditBalanceIndicator() {
  const router = useRouter();
  const { user } = useAuth();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBalance();
      
      // Refresh balance every 30 seconds
      const interval = setInterval(loadBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadBalance = async () => {
    if (!user) return;

    const data = await creditsService.getCreditBalance(user.id);
    setBalance(data);
    setLoading(false);
  };

  // Don't show if no credits or expired
  if (!balance || balance.credits === 0 || balance.isExpired) {
    return null;
  }

  const daysUntilExpiry = balance.expiresAt
    ? Math.ceil((new Date(balance.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/credits')}
            className={`flex items-center gap-2 ${
              isExpiringSoon ? 'text-orange-600 hover:text-orange-700' : 'text-primary hover:text-primary/80'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">{balance.credits}</span>
            <span className="hidden sm:inline text-sm">messages</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-semibold">{balance.credits} AI messages left</p>
            {balance.expiresAt && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {isExpiringSoon ? (
                  <span className="text-orange-600">Expires in {daysUntilExpiry} days</span>
                ) : (
                  <span>Expires {new Date(balance.expiresAt).toLocaleDateString()}</span>
                )}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">Click to buy more</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
