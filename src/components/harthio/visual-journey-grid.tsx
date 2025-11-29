'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface VisualJourneyGridProps {
  daysSober: number;
  chosenImage?: 'bridge' | 'phoenix' | 'mountain';
  unlockOrder?: number[] | null;
  className?: string;
}

const IMAGE_THEMES = {
  bridge: {
    name: 'Building Your Bridge',
    emoji: '🌉',
    description: 'Crossing from your old life to new beginnings',
    imageUrl: '/images/journey/bridge-3d.webp',
    videoUrl: '/images/journey/bridge-3d.mp4', // Optional: animated video
    isVideo: false,
    colors: {
      revealed: 'bg-gradient-to-br from-teal-400 to-cyan-500',
      hidden: 'bg-gray-200 dark:bg-gray-700',
      border: 'border-teal-300 dark:border-teal-600',
      overlay: 'bg-teal-500/20'
    }
  },
  phoenix: {
    name: 'Phoenix Rising',
    emoji: '🔥',
    description: 'Rising stronger from the ashes of your past',
    imageUrl: '/images/journey/phoenix-flames.webp',
    videoUrl: '/images/journey/phoenix-flames.mp4', // Optional: animated flames
    isVideo: false, // Set to true to use video instead
    colors: {
      revealed: 'bg-gradient-to-br from-rose-400 to-pink-500',
      hidden: 'bg-gray-200 dark:bg-gray-700',
      border: 'border-rose-300 dark:border-rose-600',
      overlay: 'bg-rose-500/20'
    }
  },
  mountain: {
    name: 'Climbing the Mountain',
    emoji: '⛰️',
    description: 'Reaching new heights in your recovery journey',
    imageUrl: '/images/journey/mountain-3d.webp',
    videoUrl: '/images/journey/mountain-3d.mp4', // Optional: animated clouds
    isVideo: false,
    colors: {
      revealed: 'bg-gradient-to-br from-emerald-400 to-green-500',
      hidden: 'bg-gray-200 dark:bg-gray-700',
      border: 'border-emerald-300 dark:border-emerald-600',
      overlay: 'bg-emerald-500/20'
    }
  }
};

export function VisualJourneyGrid({ daysSober, chosenImage = 'bridge', unlockOrder, className }: VisualJourneyGridProps) {
  const [animatingPieces, setAnimatingPieces] = useState<number[]>([]);
  
  // Calculate progress
  const totalPieces = 30;
  const daysPerPiece = 3;
  const piecesUnlocked = Math.min(Math.floor(daysSober / daysPerPiece), totalPieces);
  const nextPieceIn = daysPerPiece - (daysSober % daysPerPiece);
  const progressPercent = Math.round((piecesUnlocked / totalPieces) * 100);
  
  const theme = IMAGE_THEMES[chosenImage];
  
  // Determine which pieces are revealed based on unlock order
  const revealedPieces = new Set<number>();
  if (unlockOrder && unlockOrder.length > 0) {
    // Use random unlock order
    for (let i = 0; i < piecesUnlocked; i++) {
      revealedPieces.add(unlockOrder[i]);
    }
  } else {
    // Fallback to sequential order
    for (let i = 0; i < piecesUnlocked; i++) {
      revealedPieces.add(i);
    }
  }
  
  // Get the next piece that will unlock
  const nextPieceIndex = unlockOrder && unlockOrder.length > 0 && piecesUnlocked < totalPieces
    ? unlockOrder[piecesUnlocked]
    : piecesUnlocked;
  
  // Animate new pieces when they unlock
  useEffect(() => {
    if (piecesUnlocked > 0) {
      const newPieceIndex = unlockOrder && unlockOrder.length > 0 
        ? unlockOrder[piecesUnlocked - 1]
        : piecesUnlocked - 1;
      setAnimatingPieces([newPieceIndex]);
      const timer = setTimeout(() => setAnimatingPieces([]), 1000);
      return () => clearTimeout(timer);
    }
  }, [piecesUnlocked, unlockOrder]);
  
  // Calculate grid position for each piece (6 columns × 5 rows)
  const getGridPosition = (index: number) => {
    const row = Math.floor(index / 6);
    const col = index % 6;
    return { row, col };
  };

  // Generate grid pieces (6 columns × 5 rows = 30 pieces)
  const gridPieces = Array.from({ length: totalPieces }, (_, index) => {
    const isRevealed = revealedPieces.has(index);
    const isAnimating = animatingPieces.includes(index);
    const isNextPiece = index === nextPieceIndex;
    const { row, col } = getGridPosition(index);
    
    // Calculate background position for this piece (each piece shows 1/6 width and 1/5 height)
    const bgPosX = (col / 5) * 100; // 0%, 20%, 40%, 60%, 80%
    const bgPosY = (row / 4) * 100; // 0%, 25%, 50%, 75%
    
    return (
      <div
        key={index}
        className={cn(
          'aspect-square rounded-lg border transition-all duration-500 relative overflow-hidden',
          'flex items-center justify-center text-xs font-bold',
          isRevealed ? theme.colors.border : 'border-gray-300 dark:border-gray-600',
          isRevealed ? 'shadow-lg' : '',
          isAnimating && 'animate-pulse scale-110',
          isNextPiece && !isRevealed && 'ring-2 ring-primary/50 ring-offset-2',
          'hover:scale-105 cursor-pointer group'
        )}
        title={isRevealed ? `Piece revealed!` : isNextPiece ? `Next piece unlocks in ${nextPieceIn} days` : 'Locked'}
      >
        {/* Background Image/Video (revealed pieces only) */}
        {isRevealed && (
          <>
            {theme.isVideo ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  objectPosition: `${bgPosX}% ${bgPosY}%`,
                  transform: 'scale(6, 5)', // Scale to show only this piece's portion
                  transformOrigin: `${bgPosX}% ${bgPosY}%`,
                }}
              >
                <source src={theme.videoUrl} type="video/mp4" />
              </video>
            ) : (
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={theme.imageUrl}
                  alt={theme.name}
                  fill
                  className="object-cover"
                  style={{
                    objectPosition: `${bgPosX}% ${bgPosY}%`,
                    transform: 'scale(6, 5)',
                    transformOrigin: `${bgPosX}% ${bgPosY}%`,
                  }}
                  quality={75}
                  sizes="(max-width: 640px) 50px, 80px"
                  loading="lazy"
                />
              </div>
            )}
          </>
        )}
        
        {/* Overlay for better contrast */}
        {isRevealed && (
          <div className={cn('absolute inset-0', theme.colors.overlay)} />
        )}
        
        {/* Hidden piece background */}
        {!isRevealed && (
          <div className={cn('absolute inset-0', theme.colors.hidden)} />
        )}
        
        {/* Piece number/indicator */}
        <span className={cn(
          'relative z-10 transition-opacity group-hover:opacity-100',
          isRevealed ? 'text-white font-bold drop-shadow-lg opacity-0' : 'text-gray-400 dark:text-gray-600 opacity-100'
        )}>
          {isRevealed ? index + 1 : '🔒'}
        </span>
      </div>
    );
  });
  
  // Day 0 special state - show clean empty canvas
  if (daysSober === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{theme.emoji}</span>
            <h3 className="text-lg font-semibold text-foreground">{theme.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{theme.description}</p>
        </div>
        
        {/* Empty Canvas - Day 0 */}
        <div className="relative aspect-[6/5] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className={cn('absolute inset-0 opacity-5', theme.colors.revealed)} />
          
          {/* Center message */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="text-4xl mb-2">{theme.emoji}</div>
            <h4 className="text-lg font-semibold text-foreground">Your Journey Begins Today</h4>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your first piece will unlock in 3 days. Each milestone reveals more of your {theme.name.toLowerCase()}.
            </p>
            <Badge variant="secondary" className="mt-2">
              Day 0 • 30 pieces to unlock
            </Badge>
          </div>
        </div>
        
        {/* Milestones Preview */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 rounded border bg-muted border-border text-muted-foreground">
            <div className="font-semibold">Day 3</div>
            <div>1st piece</div>
          </div>
          <div className="text-center p-2 rounded border bg-muted border-border text-muted-foreground">
            <div className="font-semibold">Day 30</div>
            <div>10 pieces</div>
          </div>
          <div className="text-center p-2 rounded border bg-muted border-border text-muted-foreground">
            <div className="font-semibold">Day 90</div>
            <div>Complete!</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">{theme.emoji}</span>
          <h3 className="text-lg font-semibold text-foreground">{theme.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{theme.description}</p>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold">{piecesUnlocked}/{totalPieces} pieces</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="text-center">
          <Badge variant="secondary" className="text-xs">
            {progressPercent}% Complete
          </Badge>
        </div>
      </div>
      
      {/* 30-Piece Grid (6×5) - Always 6 columns for correct image splitting */}
      <div className="grid grid-cols-6 gap-0.5 sm:gap-1 p-2 sm:p-4 bg-muted/30 rounded-lg border overflow-x-auto">
        {gridPieces}
      </div>
      
      {/* Helper Text */}
      <p className="text-xs text-center text-muted-foreground">
        <span className="sm:hidden">Swipe to see all pieces • </span>
        Each piece unlocks every 3 days
      </p>
      
      {/* Next Milestone */}
      <div className="text-center space-y-1">
        {piecesUnlocked < totalPieces ? (
          <>
            <p className="text-sm text-muted-foreground">
              Next piece in <span className="font-semibold text-primary">{nextPieceIn} days</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Day {(piecesUnlocked + 1) * daysPerPiece} milestone
            </p>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary">🎉 Journey Complete!</p>
            <p className="text-xs text-muted-foreground">
              You've built your complete {theme.name.toLowerCase()}!
            </p>
          </div>
        )}
      </div>
      
      {/* Milestones */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className={cn(
          'text-center p-2 rounded border',
          piecesUnlocked >= 10 ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted border-border text-muted-foreground'
        )}>
          <div className="font-semibold">30 Days</div>
          <div>10 pieces</div>
        </div>
        <div className={cn(
          'text-center p-2 rounded border',
          piecesUnlocked >= 20 ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted border-border text-muted-foreground'
        )}>
          <div className="font-semibold">60 Days</div>
          <div>20 pieces</div>
        </div>
        <div className={cn(
          'text-center p-2 rounded border',
          piecesUnlocked >= 30 ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted border-border text-muted-foreground'
        )}>
          <div className="font-semibold">90 Days</div>
          <div>30 pieces</div>
        </div>
      </div>
    </div>
  );
}
