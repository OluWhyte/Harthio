'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X } from 'lucide-react';
import { type MoodType } from '@/lib/checkin-service';

interface ContextualCheckInProps {
  mood: MoodType;
  onSave: (note?: string) => Promise<void>;
  onSkip: () => void;
}

const MOOD_PROMPTS: Record<MoodType, { emoji: string; prompt: string; placeholder: string }> = {
  struggling: {
    emoji: '💙',
    prompt: "What's making today tough? Want to talk?",
    placeholder: "It's okay to share what you're going through...",
  },
  okay: {
    emoji: '🤔',
    prompt: "Anything on your mind today?",
    placeholder: "Optional - share what's on your mind...",
  },
  good: {
    emoji: '🎉',
    prompt: "What made you feel good today?",
    placeholder: "Share what's going well...",
  },
  great: {
    emoji: '✨',
    prompt: "That's amazing! What's going well?",
    placeholder: "Celebrate your wins...",
  },
};

export function ContextualCheckIn({ mood, onSave, onSkip }: ContextualCheckInProps) {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const config = MOOD_PROMPTS[mood];

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(note.trim() || undefined);
    setIsSaving(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
      <div className="bg-card border-b shadow-lg">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span>{config.emoji}</span>
                <span>{config.prompt}</span>
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSkip}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={config.placeholder}
            className="min-h-[100px] mb-4"
            disabled={isSaving}
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onSkip}
              disabled={isSaving}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
