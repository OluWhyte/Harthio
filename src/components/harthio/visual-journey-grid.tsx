'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface VisualJourneyGridProps {
  daysSober: number;
  chosenImage?: 'bridge' | 'phoenix' | 'mountain';
  className?: string;
}

const IMAGE_THEMES = {
  bridge: {
    name: 'Building Your Bridge',
    emoji: '🌉',
    description: 'Crossing from your old life to new beginnings',
    colors: {
      revealed: 'bg-gradient-to-br from-teal-400 to-cyan-500',
      hidden: 'bg-gray-200 dark:bg-gray-700',
      border: 'border-teal-300 dark:border-teal-600'
    }
  },
  phoenix: {
    name: 'Phoenix Rising',
    emoji: '🔥',
    description: 'Rising stronger from the ashes of your past',
    colors: {
      revealed: 'bg-gradient-to-br from-rose-400 to-pink-500',
      hidden: 'bg-gray-200 dark:bg-gray-700',
      border: 'border-rose-300 dark:border-rose-600'
    }
  },
  mountain: {
    name: 'Climbing the Mountain',
    emoji: '⛰️',
    description: 'Reaching new heights in your recovery journey',
    colors: {
      revealed: 'bg-gradient-to-br from-emerald-400 to-green-500',
      hidden: 'bg-gray-200 dark:bg-gray-700',
      border: 'border-emerald-300 dark:border-emerald-600'
    }
  }
};

export function VisualJourneyGrid({ daysSober, chosenImage = 'bridge', className }: VisualJourneyGridProps) {
  const [animatingPieces, setAnimatingPieces] = useState<number[]>([]);
  
  // Calculate progress
  const totalPieces = 30;
  const daysPerPiece = 3;
  const piecesUnlocked = Math.min(Math.floor(daysSober / daysPerPiece), totalPieces);
  const nextPieceIn = daysPerPiece - (daysSober % daysPerPiece);
  const progressPercent = Math.round((piecesUnlocked / totalPieces) * 100);
  
  const theme = IMAGE_THEMES[chosenImage];
  
  // Animate new pieces when they unlock
  useEffect(() => {
    if (piecesUnlocked > 0) {
      const newPiece = piecesUnlocked - 1;
      setAnimatingPieces([newPiece]);
      const timer = setTimeout(() => setAnimatingPieces([]), 1000);
      return () => clearTimeout(timer);
    }
  }, [piecesUnlocked]);
  
  // Generate grid pieces (6 columns × 5 rows = 30 pieces)
  const gridPieces = Array.from({ length: totalPieces }, (_, index) => {
    const isRevealed = index < piecesUnlocked;
    const isAnimating = animatingPieces.includes(index);
    
    return (
      <div
        key={index}
        className={cn(
          'aspect-square rounded-lg border-2 transition-all duration-500',
          'flex items-center justify-center text-xs font-bold',
          isRevealed ? theme.colors.revealed : theme.colors.hidden,
          isRevealed ? theme.colors.border : 'border-gray-300 dark:border-gray-600',
          isRevealed ? 'text-white shadow-lg' : 'text-gray-400 dark:text-gray-500',
          isAnimating && 'animate-pulse scale-110',
          'hover:scale-105 cursor-pointer'
        )}
        title={isRevealed ? `Piece ${index + 1} - Day ${(index + 1) * daysPerPiece}` : `Unlocks at Day ${(index + 1) * daysPerPiece}`}
      >
        {isRevealed ? (
          <span className="text-white/80">{index + 1}</span>
        ) : (
          <span className="text-gray-400 dark:text-gray-600">•</span>
        )}
      </div>
    );
  });
  
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
      
      {/* 30-Piece Grid (6×5) */}
      <div className="grid grid-cols-6 gap-2 p-4 bg-muted/30 rounded-lg border">
        {gridPieces}
      </div>
      
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
