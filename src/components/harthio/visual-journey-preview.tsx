'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VisualJourneyPreviewProps {
  theme: 'bridge' | 'phoenix' | 'mountain';
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const THEME_INFO = {
  bridge: {
    name: 'Building Your Bridge',
    emoji: '🌉',
    description: 'Crossing from your old life to new beginnings',
    imageUrl: '/images/journey/bridge-3d.webp',
    color: 'from-teal-400 to-cyan-500',
    borderColor: 'border-teal-500',
  },
  phoenix: {
    name: 'Phoenix Rising',
    emoji: '🔥',
    description: 'Rising stronger from the ashes of your past',
    imageUrl: '/images/journey/phoenix-flames.webp',
    color: 'from-rose-400 to-pink-500',
    borderColor: 'border-rose-500',
  },
  mountain: {
    name: 'Climbing the Mountain',
    emoji: '⛰️',
    description: 'Reaching new heights in your recovery journey',
    imageUrl: '/images/journey/mountain-3d.webp',
    color: 'from-emerald-400 to-green-500',
    borderColor: 'border-emerald-500',
  },
};

export function VisualJourneyPreview({ theme, selected, onClick, className }: VisualJourneyPreviewProps) {
  const info = THEME_INFO[theme];

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:scale-105',
        selected && `ring-2 ${info.borderColor}`,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{info.emoji}</span>
            <h4 className="font-semibold text-sm">{info.name}</h4>
          </div>
          {selected && (
            <Badge variant="default" className="text-xs">
              Selected
            </Badge>
          )}
        </div>

        {/* Preview Image */}
        <div className="relative aspect-[3/2] rounded-lg overflow-hidden border bg-gray-100 dark:bg-gray-800">
          <Image
            src={info.imageUrl}
            alt={info.name}
            fill
            className="object-cover"
            quality={60}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
          />
          <div className={cn('absolute inset-0 bg-gradient-to-br opacity-20', info.color)} />
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground">{info.description}</p>
      </CardContent>
    </Card>
  );
}
