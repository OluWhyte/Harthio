'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Calendar, MessageCircle, Loader2 } from 'lucide-react';
import { MobileNavigation } from '@/components/harthio/mobile-navigation';
import { checkinService, type MoodType } from '@/lib/checkin-service';
import { useToast } from '@/hooks/use-toast';
import { topicService } from '@/lib/supabase-services';

// Recovery-focused motivational quotes (one per day)
const motivationalQuotes = [
  "Recovery is not a race. You don't have to feel guilty if it takes you longer than you thought it would.",
  "One day at a time. That's all we have to do.",
  "You are stronger than your struggles. Keep going.",
  "Healing doesn't mean the damage never existed. It means the damage no longer controls your life.",
  "Your mental health is a priority. Your happiness is essential. Your self-care is a necessity.",
  "Recovery is about progression, not perfection.",
  "The only person you are destined to become is the person you decide to be.",
  "You don't have to be positive all the time. It's perfectly okay to feel sad, angry, annoyed, frustrated, scared and anxious. Having feelings doesn't make you a negative person. It makes you human.",
  "Small steps in the right direction can turn out to be the biggest step of your life.",
  "You are not your illness. You have an individual story to tell. You have a name, a history, a personality. Staying yourself is part of the battle.",
  "Recovery is not linear. Some days will be harder than others, but every day you choose recovery is a victory.",
  "The greatest glory in living lies not in never falling, but in rising every time we fall.",
  "You are allowed to be both a masterpiece and a work in progress simultaneously.",
  "Courage doesn't always roar. Sometimes courage is the quiet voice at the end of the day saying, 'I will try again tomorrow.'",
  "Your story isn't over yet. Keep going.",
  "Recovery is an acceptance that your life is in shambles and you have to change it.",
  "The only way out is through.",
  "You didn't come this far to only come this far.",
  "Be patient with yourself. Nothing in nature blooms all year.",
  "Recovery is hard. Regret is harder.",
  "You are not alone in this journey. Reach out when you need support.",
  "Every day you stay in recovery is a day you're choosing yourself.",
  "The comeback is always stronger than the setback.",
  "You can't go back and change the beginning, but you can start where you are and change the ending.",
  "Recovery is giving yourself permission to live.",
  "Your mental health journey is unique. Don't compare your chapter 1 to someone else's chapter 20.",
  "Sobriety delivers everything that alcohol or drugs promised.",
  "You are worthy of recovery. You are worthy of peace. You are worthy of happiness.",
  "The only impossible journey is the one you never begin.",
  "Recovery is not for people who need it, it's for people who want it.",
  "You've survived 100% of your worst days. You're doing great.",
];

// Get quote based on day of year (same quote for the whole day)
function getDailyQuote(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const quoteIndex = dayOfYear % motivationalQuotes.length;
  return motivationalQuotes[quoteIndex];
}

export default function HomePage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [greeting, setGreeting] = useState('');
  const [dailyQuote, setDailyQuote] = useState('');
  const [todayCheckIn, setTodayCheckIn] = useState<MoodType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [sessionsJoined, setSessionsJoined] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

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

    // Load today's check-in and stats
    if (user?.uid) {
      const loadData = async () => {
        try {
          // Get today's check-in
          const checkIn = await checkinService.getTodayCheckIn(user.uid);
          if (checkIn) {
            setTodayCheckIn(checkIn.mood as MoodType);
          }

          // Get check-in streak
          const streak = await checkinService.getCheckInStreak(user.uid);
          setCheckInStreak(streak);

          // Get total check-ins
          const history = await checkinService.getCheckInHistory(user.uid);
          setTotalCheckIns(history.length);

          // Get sessions joined
          const allTopics = await topicService.getAllTopics();
          const userSessions = allTopics.filter(topic => {
            const isAuthor = topic.author_id === user.uid;
            const isParticipant = topic.participants?.includes(user.uid);
            const isPast = new Date(topic.end_time) < new Date();
            return (isAuthor || isParticipant) && isPast;
          });
          setSessionsJoined(userSessions.length);
        } catch (error) {
          console.error('Error loading home data:', error);
        } finally {
          setStatsLoading(false);
        }
      };

      loadData();
    }
  }, [user, router]);

  const handleCheckIn = async (mood: MoodType) => {
    if (!user?.uid || isSubmitting) return;

    setIsSubmitting(true);
    const result = await checkinService.saveCheckIn(user.uid, mood);

    if (result.success) {
      setTodayCheckIn(mood);
      toast({
        title: 'Check-in saved!',
        description: `You're feeling ${mood} today. Keep going! 💪`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to save check-in. Please try again.',
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  if (!user || !userProfile) return null;

  const firstName = userProfile.first_name || userProfile.display_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold">{greeting}, {firstName}! 👋</h1>
          <p className="text-muted-foreground mt-1">Welcome to your recovery journey</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Daily Quote */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="text-lg font-medium mb-2">Today's Inspiration</p>
                <p className="text-muted-foreground italic leading-relaxed">
                  "{dailyQuote}"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold">{checkInStreak}</p>
                      <p className="text-sm text-muted-foreground">Day Streak</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold">{sessionsJoined}</p>
                      <p className="text-sm text-muted-foreground">Sessions Joined</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-500/10">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold">{totalCheckIns}</p>
                      <p className="text-sm text-muted-foreground">Total Check-ins</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
                onClick={() => handleCheckIn('struggling')}
                disabled={isSubmitting}
              >
                {isSubmitting && todayCheckIn !== 'struggling' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <span className="text-3xl">😢</span>
                    <span className="text-sm">Struggling</span>
                  </>
                )}
              </Button>
              <Button 
                variant={todayCheckIn === 'okay' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2" 
                onClick={() => handleCheckIn('okay')}
                disabled={isSubmitting}
              >
                {isSubmitting && todayCheckIn !== 'okay' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <span className="text-3xl">😐</span>
                    <span className="text-sm">Okay</span>
                  </>
                )}
              </Button>
              <Button 
                variant={todayCheckIn === 'good' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2" 
                onClick={() => handleCheckIn('good')}
                disabled={isSubmitting}
              >
                {isSubmitting && todayCheckIn !== 'good' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <span className="text-3xl">😊</span>
                    <span className="text-sm">Good</span>
                  </>
                )}
              </Button>
              <Button 
                variant={todayCheckIn === 'great' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2" 
                onClick={() => handleCheckIn('great')}
                disabled={isSubmitting}
              >
                {isSubmitting && todayCheckIn !== 'great' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <span className="text-3xl">🚀</span>
                    <span className="text-sm">Great</span>
                  </>
                )}
              </Button>
            </div>
            {todayCheckIn && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                You can update your check-in anytime today
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">What would you like to do?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-16 justify-start gap-3"
                onClick={() => router.push('/dashboard')}
              >
                <Calendar className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Browse Sessions</p>
                  <p className="text-xs text-muted-foreground">Connect with others</p>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 justify-start gap-3"
                onClick={() => router.push('/progress')}
                disabled
              >
                <TrendingUp className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">View Progress</p>
                  <p className="text-xs text-muted-foreground">Track your journey</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileNavigation />
    </div>
  );
}
