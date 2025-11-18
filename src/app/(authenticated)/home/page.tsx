'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { checkinService, type MoodType } from '@/lib/checkin-service';
import { sobrietyService, type SobrietyTracker } from '@/lib/sobriety-service';
import { SobrietyCounter } from '@/components/harthio/sobriety-counter';
import { ContextualCheckIn } from '@/components/harthio/contextual-checkin';
import { useToast } from '@/hooks/use-toast';

// Short motivational quotes (simplified)
const quotes = [
  "One day at a time. 💪",
  "You are stronger than your struggles.",
  "Recovery is progress, not perfection.",
  "Every day is a victory. Keep going.",
  "You've survived 100% of your worst days.",
];

function getDailyQuote(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return quotes[dayOfYear % quotes.length];
}

export default function HomePage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [greeting, setGreeting] = useState('');
  const [dailyQuote, setDailyQuote] = useState('');
  const [todayCheckIn, setTodayCheckIn] = useState<MoodType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sobrietyTrackers, setSobrietyTrackers] = useState<SobrietyTracker[]>([]);
  const [trackersLoading, setTrackersLoading] = useState(true);
  const [showContextualInput, setShowContextualInput] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Set daily quote
    setDailyQuote(getDailyQuote());

    // Load today's check-in and sobriety trackers
    if (user?.uid) {
      const loadData = async () => {
        try {
          // Get today's check-in
          const checkIn = await checkinService.getTodayCheckIn(user.uid);
          if (checkIn) {
            setTodayCheckIn(checkIn.mood as MoodType);
          }

          // Get sobriety trackers
          const trackers = await sobrietyService.getActiveTrackers(user.uid);
          setSobrietyTrackers(trackers);
        } catch (error) {
          console.error('Error loading home data:', error);
        } finally {
          setTrackersLoading(false);
        }
      };

      loadData();
    }
  }, [user, router]);

  const handleMoodClick = (mood: MoodType) => {
    if (!user?.uid || isSubmitting) return;
    setSelectedMood(mood);
    setShowContextualInput(true);
  };

  const handleSaveCheckIn = async (note?: string) => {
    if (!user?.uid || !selectedMood) return;

    const result = await checkinService.saveCheckIn(user.uid, selectedMood, note);

    if (result.success) {
      setTodayCheckIn(selectedMood);
      setShowContextualInput(false);
      toast({
        title: 'Check-in saved!',
        description: `You're feeling ${selectedMood} today. Keep going! 💪`,
      });

      // Pattern Detection: Check for struggling pattern
      if (selectedMood === 'struggling') {
        const pattern = await checkinService.detectStrugglingPattern(user.uid);
        
        if (pattern.shouldIntervene) {
          // Show intervention notification and redirect
          toast({
            title: 'We\'re here for you 💙',
            description: `You've been struggling for ${pattern.consecutiveDays} days. Let's talk with Harthio AI?`,
            duration: 5000,
          });
          
          // Redirect to AI after a short delay
          setTimeout(() => {
            router.push('/harthio?action=intervention');
          }, 2000);
        }
      }
    } else {
      toast({
        title: 'Error',
        description: 'Failed to save check-in. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSkipNote = () => {
    setShowContextualInput(false);
    if (selectedMood) {
      handleSaveCheckIn();
    }
  };

  if (!user || !userProfile) return null;

  const firstName = userProfile.first_name || userProfile.display_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-background">
      {/* Contextual Check-in Slide-down */}
      {showContextualInput && selectedMood && (
        <ContextualCheckIn
          mood={selectedMood}
          onSave={handleSaveCheckIn}
          onSkip={handleSkipNote}
        />
      )}

      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold">{greeting}, {firstName}! 👋</h1>
          <p className="text-[15px] text-muted-foreground mt-1">Welcome to your recovery journey</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Sobriety Counter */}
        {trackersLoading ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <SobrietyCounter 
            trackers={sobrietyTrackers}
            onReset={(trackerId) => {
              // AI-Guarded Reset: Redirect to Harthio AI for support
              router.push(`/harthio?action=reset&tracker=${trackerId}`);
            }}
          />
        )}

        {/* Add Tracker Button - AI Powered */}
        {!trackersLoading && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push('/harthio?action=create-tracker')}
          >
            <Plus className="h-4 w-4 mr-2" />
            {sobrietyTrackers.length === 0 ? 'Add Recovery Tracker' : 'Add Another Tracker'}
          </Button>
        )}

        {/* Daily Quote - Simplified */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-lg">
          <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-sm text-muted-foreground italic">{dailyQuote}</p>
        </div>

        {/* Daily Check-in */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {todayCheckIn ? "You checked in today!" : "How are you feeling today?"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant={todayCheckIn === 'struggling' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2" 
                onClick={() => handleMoodClick('struggling')}
                disabled={isSubmitting || showContextualInput}
              >
                <span className="text-3xl">😢</span>
                <span className="text-sm">Struggling</span>
              </Button>
              <Button 
                variant={todayCheckIn === 'okay' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2" 
                onClick={() => handleMoodClick('okay')}
                disabled={isSubmitting || showContextualInput}
              >
                <span className="text-3xl">😐</span>
                <span className="text-sm">Okay</span>
              </Button>
              <Button 
                variant={todayCheckIn === 'good' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2" 
                onClick={() => handleMoodClick('good')}
                disabled={isSubmitting || showContextualInput}
              >
                <span className="text-3xl">😊</span>
                <span className="text-sm">Good</span>
              </Button>
              <Button 
                variant={todayCheckIn === 'great' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2" 
                onClick={() => handleMoodClick('great')}
                disabled={isSubmitting || showContextualInput}
              >
                <span className="text-3xl">🚀</span>
                <span className="text-sm">Great</span>
              </Button>
            </div>
            {todayCheckIn && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                You can update your check-in anytime today
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
