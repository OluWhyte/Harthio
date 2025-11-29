'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

interface UpgradePromptProps {
  feature?: string;
  benefits?: string[];
  compact?: boolean;
}

export function UpgradePrompt({ 
  feature = 'This feature',
  benefits,
  compact = false
}: UpgradePromptProps) {
  const router = useRouter();

  const defaultBenefits = [
    'Unlimited AI conversations (up to 200/day)',
    'Full CBT tools suite',
    'Pattern detection & insights',
    'Advanced recovery tracking',
    'Unlimited trackers with visual journey'
  ];

  const displayBenefits = benefits || defaultBenefits;

  if (compact) {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
        <p className="text-sm font-medium">
          {feature} is a Pro feature
        </p>
        <Button
          onClick={() => router.push('/upgrade?trial=true')}
          size="sm"
          className="w-full"
        >
          Start 14-Day Free Trial
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">
          {feature} is a Pro Feature
        </h3>
        <p className="text-sm text-muted-foreground">
          Upgrade to Pro for full access:
        </p>
      </div>

      <ul className="space-y-2">
        {displayBenefits.map((benefit, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="pt-2 space-y-2">
        <p className="text-sm font-medium">
          Only $9.99/month - less than a therapy copay!
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push('/upgrade?trial=true')}
            className="flex-1"
          >
            Start 14-Day Free Trial
          </Button>
          <Button
            onClick={() => router.push('/upgrade')}
            variant="outline"
            className="flex-1"
          >
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
}
