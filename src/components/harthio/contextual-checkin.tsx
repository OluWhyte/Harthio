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
    prompt: "What's making today tough?",
    placeholder: "It's okay to share what you're going through...",
  },
  okay: {
    emoji: '🤔',
    prompt: "Anything on your mind?",
    placeholder: "Optional - share what's on your mind...",
  },
  good: {
    emoji: '🎉',
    prompt: "What made you feel good?",
    placeholder: "Share what's going well...",
  },
  great: {
    emoji: '✨',
    prompt: "What's going well?",
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
    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down p-0 md:p-4">
      {/* Glass morphism card - same as tracker */}
      <div className="backdrop-blur-xl bg-white/10 dark:bg-black/20 border-b md:border border-white/20 rounded-b-2xl md:rounded-2xl shadow-2xl max-w-2xl md:mx-auto">
        <div className="p-4 md:p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              {/* Responsive text size */}
              <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                <span>{config.emoji}</span>
                <span>{config.prompt}</span>
              </h3>
            </div>
            <button
              onClick={onSkip}
              disabled={isSaving}
              className="p-1 hover:bg-muted rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={config.placeholder}
            className="min-h-[80px] md:min-h-[100px] mb-3 text-sm md:text-base"
            disabled={isSaving}
          />

          {/* Single Save button - centered on mobile, right on desktop */}
          <div className="flex justify-center md:justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="w-40 md:w-auto md:min-w-[120px]"
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
