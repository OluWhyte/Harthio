'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Plus, Bell } from 'lucide-react';
import { checkinService, type MoodType } from '@/lib/checkin-service';
import { sobrietyService, type SobrietyTracker } from '@/lib/sobriety-service';
import { SobrietyCounter } from '@/components/harthio/sobriety-counter';
import { AddTrackerDialog } from '@/components/harthio/add-tracker-dialog';
import { ContextualCheckIn } from '@/components/harthio/contextual-checkin';
import { useToast } from '@/hooks/use-toast';
import { MobilePageHeader } from '@/components/harthio/mobile-page-header';
import { WelcomeBanner } from '@/components/harthio/welcome-banner';
import { useOptimizedRequests } from '@/hooks/use-optimized-requests';
import { useIdleDetection } from '@/hooks/useProactiveAI';

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
  const { receivedRequests } = useOptimizedRequests();
  const [greeting, setGreeting] = useState('');
  const [dailyQuote, setDailyQuote] = useState('');
  const [todayCheckIn, setTodayCheckIn] = useState<MoodType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sobrietyTrackers, setSobrietyTrackers] = useState<SobrietyTracker[]>([]);
  const [trackersLoading, setTrackersLoading] = useState(true);
  const [showContextualInput, setShowContextualInput] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);

  // Reload trackers after adding new one
  const reloadTrackers = async () => {
    if (!user?.uid) return;
    const trackers = await sobrietyService.getActiveTrackers(user.uid);
    setSobrietyTrackers(trackers);
  };

  // Proactive AI: Detect idle on home page
  useIdleDetection();

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

    // Load today's check-in and sobriety trackers in parallel
    if (user?.uid) {
      const loadData = async () => {
        try {
          // Load both in parallel for better performance
          const [checkIn, trackers] = await Promise.all([
            checkinService.getTodayCheckIn(user.uid),
            sobrietyService.getActiveTrackers(user.uid)
          ]);

          if (checkIn) {
            setTodayCheckIn(checkIn.mood as MoodType);
          }
          setSobrietyTrackers(trackers);
        } catch (error) {
          console.error('Error loading home data:', error);
        } finally {
          setTrackersLoading(false);
        }
      };

      loadData();
      
      // Prefetch likely next pages for instant navigation
      router.prefetch('/sessions');
      router.prefetch('/harthio');
      router.prefetch('/progress');
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

  // Get current tracker for background
  const currentTracker = sobrietyTrackers[0];
  const hasTracker = sobrietyTrackers.length > 0;
  const chosenImage = currentTracker?.chosen_image || 'bridge';
  const unlockOrder = currentTracker?.piece_unlock_order;

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

      {/* Unified Mobile Header - Outside background */}
      <div className="relative z-50">
        <MobilePageHeader
          actions={[
            {
              icon: Bell,
              onClick: () => router.push('/notifications'),
              label: 'Notifications',
              badge: receivedRequests.length,
            },
          ]}
        />
      </div>

      {/* Content Area with Background */}
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
        {/* Simple gradient background (visual journey moved to v0.4) */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />

        {/* Content on top of background */}
        <div className="relative z-10">
          {/* Greeting - Inside gradient background for both mobile and desktop */}
          <div className="px-4 md:px-6 pt-4 pb-2 md:pb-4">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{greeting}, {firstName}! 👋</h1>
            <p className="hidden md:block text-[15px] text-muted-foreground mt-1">Welcome to your recovery journey</p>
          </div>

          {/* Main Content Area */}
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6 pb-20 md:pb-6">
            {/* Welcome Banner for New Users */}
            <WelcomeBanner firstName={firstName} />

            {/* Sobriety Counter */}
        {trackersLoading ? (
          <div className="rounded-apple-xl p-12 shadow-apple-xl animate-fade-in bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <Loader2 className={`h-8 w-8 animate-spin mx-auto ${hasTracker ? 'text-white' : 'text-primary'}`} />
            </div>
          </div>
        ) : (
          <div className="rounded-apple-xl shadow-apple-xl overflow-hidden transition-all duration-apple ease-apple hover:shadow-apple-xl animate-fade-in bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700">
            <SobrietyCounter 
              trackers={sobrietyTrackers}
              hasBackground={false}
              onReset={(trackerId) => {
                // AI-Guarded Reset: Redirect to Harthio AI for support
                router.push(`/harthio?action=reset&tracker=${trackerId}`);
              }}
              onTrackerUpdated={reloadTrackers}
            />
          </div>
        )}

        {/* Add Tracker Button - Apple Style */}
        {!trackersLoading && (
          <div className="flex justify-center animate-fade-in">
            {sobrietyTrackers.length === 0 ? (
              // First tracker: Use AI-guided flow for onboarding
              <button 
                onClick={() => router.push('/harthio?action=create-tracker')}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full shadow-apple transition-all duration-apple ease-apple-spring hover:scale-[1.05] hover:shadow-apple-lg active:scale-95 cursor-pointer bg-primary hover:bg-primary/90 text-white border-0"
              >
                <Plus className="h-4 w-4 transition-transform duration-apple ease-apple-spring group-hover:rotate-90" />
                <span className="text-sm md:text-base font-semibold">
                  Add Tracker
                </span>
              </button>
            ) : (
              // Subsequent trackers: Direct dialog for speed
              <AddTrackerDialog userId={user?.uid || ''} onTrackerAdded={reloadTrackers}>
                <button 
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-full shadow-apple transition-all duration-apple ease-apple-spring hover:scale-[1.05] hover:shadow-apple-lg active:scale-95 cursor-pointer bg-primary hover:bg-primary/90 text-white border-0"
                >
                  <Plus className="h-4 w-4 transition-transform duration-apple ease-apple-spring group-hover:rotate-90" />
                  <span className="text-sm md:text-base font-semibold">
                    Add Another
                  </span>
                </button>
              </AddTrackerDialog>
            )}
          </div>
        )}

        {/* Daily Check-in - Adaptive Apple Style */}
        <div className="rounded-apple-xl shadow-apple-xl p-4 sm:p-6 transition-all duration-apple ease-apple animate-fade-in bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700">
            <h2 className="text-base sm:text-[17px] font-semibold mb-3 sm:mb-4 text-foreground">
              How are you feeling today?
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { mood: 'struggling', emoji: '😢', label: 'Struggling', 
                  defaultColor: 'bg-red-100 hover:bg-red-200 text-red-900 shadow-md shadow-red-200/60 hover:shadow-xl hover:shadow-red-300/80',
                  selectedColor: 'bg-red-200 text-red-950 shadow-xl shadow-red-400/80 ring-2 ring-red-400 ring-offset-2 animate-pulse',
                  unselectedColor: 'bg-red-50 text-red-400 shadow-none' },
                { mood: 'okay', emoji: '😐', label: 'Okay', 
                  defaultColor: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-900 shadow-md shadow-yellow-200/60 hover:shadow-xl hover:shadow-yellow-300/80',
                  selectedColor: 'bg-yellow-200 text-yellow-950 shadow-xl shadow-yellow-400/80 ring-2 ring-yellow-400 ring-offset-2 animate-pulse',
                  unselectedColor: 'bg-yellow-50 text-yellow-400 shadow-none' },
                { mood: 'good', emoji: '😊', label: 'Good', 
                  defaultColor: 'bg-blue-100 hover:bg-blue-200 text-blue-900 shadow-md shadow-blue-200/60 hover:shadow-xl hover:shadow-blue-300/80',
                  selectedColor: 'bg-blue-200 text-blue-950 shadow-xl shadow-blue-400/80 ring-2 ring-blue-400 ring-offset-2 animate-pulse',
                  unselectedColor: 'bg-blue-50 text-blue-400 shadow-none' },
                { mood: 'great', emoji: '🚀', label: 'Great', 
                  defaultColor: 'bg-green-100 hover:bg-green-200 text-green-900 shadow-md shadow-green-200/60 hover:shadow-xl hover:shadow-green-300/80',
                  selectedColor: 'bg-green-200 text-green-950 shadow-xl shadow-green-400/80 ring-2 ring-green-400 ring-offset-2 animate-pulse',
                  unselectedColor: 'bg-green-50 text-green-400 shadow-none' },
              ].map(({ mood, emoji, label, defaultColor, selectedColor, unselectedColor }) => (
                <button
                  key={mood}
                  onClick={() => handleMoodClick(mood as MoodType)}
                  disabled={isSubmitting || showContextualInput}
                  className={`
                    group h-24 sm:h-28 md:h-32 rounded-apple-lg transition-all duration-apple ease-apple-spring flex flex-col items-center justify-center gap-2 sm:gap-3
                    ${todayCheckIn === mood 
                      ? `${selectedColor} scale-105` 
                      : todayCheckIn && todayCheckIn !== mood
                      ? unselectedColor
                      : defaultColor
                    }
                    ${isSubmitting || showContextualInput ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.08] hover:-translate-y-1 active:scale-95 cursor-pointer'}
                    transform-gpu
                  `}
                >
                  <span className="text-3xl sm:text-4xl md:text-5xl transition-all duration-apple ease-apple-spring group-hover:scale-125 group-hover:rotate-12">{emoji}</span>
                  <span className="text-sm sm:text-base font-semibold transition-all duration-apple group-hover:font-bold">{label}</span>
                </button>
              ))}
            </div>
            {todayCheckIn && (
              <p className="text-xs sm:text-[13px] mt-3 sm:mt-4 text-center text-muted-foreground">
                You can update your check-in anytime today
              </p>
            )}
        </div>

        {/* Daily Quote - Adaptive */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-apple shadow-apple bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-primary" />
          <p className="text-[13px] italic text-muted-foreground">{dailyQuote}</p>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
