'use client';

import { VisualJourneyGrid } from '@/components/harthio/visual-journey-grid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { sobrietyService } from '@/lib/sobriety-service';

export default function TestJourneyPage() {
  const [daysSober, setDaysSober] = useState(30); // Start with 30 days (10 pieces unlocked)
  const [chosenImage, setChosenImage] = useState<'bridge' | 'phoenix' | 'mountain'>('phoenix');
  
  // Generate a random unlock order (stays consistent during this session)
  const unlockOrder = useMemo(() => sobrietyService.generateRandomUnlockOrder(30), []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Visual Journey Test Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium">Days Sober: {daysSober}</label>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={daysSober}
                  onChange={(e) => setDaysSober(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Pieces unlocked: {Math.floor(daysSober / 3)}/30
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Theme:</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={chosenImage === 'bridge' ? 'default' : 'outline'}
                    onClick={() => setChosenImage('bridge')}
                  >
                    🌉 Bridge
                  </Button>
                  <Button
                    size="sm"
                    variant={chosenImage === 'phoenix' ? 'default' : 'outline'}
                    onClick={() => setChosenImage('phoenix')}
                  >
                    🔥 Phoenix
                  </Button>
                  <Button
                    size="sm"
                    variant={chosenImage === 'mountain' ? 'default' : 'outline'}
                    onClick={() => setChosenImage('mountain')}
                  >
                    ⛰️ Mountain
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Test:</label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setDaysSober(0)}>
                    Day 0
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDaysSober(15)}>
                    Day 15
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDaysSober(45)}>
                    Day 45
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDaysSober(90)}>
                    Day 90
                  </Button>
                </div>
              </div>
            </div>

            {/* Visual Journey Grid */}
            <VisualJourneyGrid
              daysSober={daysSober}
              chosenImage={chosenImage}
              unlockOrder={unlockOrder}
            />
            
            {/* Random Order Info */}
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                🎲 Random Unlock Order Active!
              </h3>
              <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                Pieces unlock in random order for suspense. Each tracker gets a unique pattern.
              </p>
              <details className="text-xs text-purple-700 dark:text-purple-300">
                <summary className="cursor-pointer hover:underline">Show unlock sequence</summary>
                <div className="mt-2 font-mono bg-purple-100 dark:bg-purple-900 p-2 rounded">
                  {unlockOrder.slice(0, 10).join(', ')}... (first 10 pieces)
                </div>
              </details>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                📝 How to Test:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Use the slider to change days sober (0-90)</li>
                <li>• Click theme buttons to switch images</li>
                <li>• Watch pieces unlock in RANDOM order every 3 days 🎲</li>
                <li>• Notice the next piece has a glowing ring</li>
                <li>• Hover over pieces to see status</li>
                <li>• Test on mobile by resizing browser</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
