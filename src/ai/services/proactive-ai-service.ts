import { supabase } from '@/lib/supabase';
import { getUserTier } from '@/lib/services/tier-service';

export interface ProactivePrompt {
  id: string;
  message: string;
  emoji: string;
  actions: Array<{
    label: string;
    action: string;
    variant?: 'default' | 'outline';
  }>;
  metadata?: {
    sessionTitle?: string;
    sessionTopic?: string;
  };
}

// Cooldown tracking to prevent spam (persisted in localStorage)
const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours for free, will adjust for pro
const STORAGE_KEY = 'proactive_ai_cooldowns';

// Get cooldowns from localStorage
function getCooldowns(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save cooldowns to localStorage
function saveCooldowns(cooldowns: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cooldowns));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

// Check if we should show a prompt (respects cooldowns)
function canShowPrompt(promptId: string, userTier: 'free' | 'pro'): boolean {
  const cooldowns = getCooldowns();
  const lastShown = cooldowns[promptId];
  if (!lastShown) return true;

  const cooldown = userTier === 'pro' ? 30 * 60 * 1000 : COOLDOWN_MS; // 30 min pro, 2 hours free
  return Date.now() - lastShown > cooldown;
}

function markPromptShown(promptId: string) {
  const cooldowns = getCooldowns();
  cooldowns[promptId] = Date.now();
  saveCooldowns(cooldowns);
}

// Trigger proactive AI prompt
function triggerPrompt(prompt: ProactivePrompt) {
  if (typeof window !== 'undefined' && window.showProactiveAI) {
    window.showProactiveAI(prompt);
    markPromptShown(prompt.id);
  }
}

// Message variations for natural, non-repetitive prompts
const MESSAGE_VARIATIONS = {
  session_browsing: [
    "I noticed you're looking for a session. Having trouble finding the right one?",
    "Still searching for a session? Want some help finding a good match?",
    "Looking for the perfect session? I can help you narrow it down!",
    "Need help finding a session that fits what you're looking for?",
    "Browsing sessions? Let me help you find one that resonates with you."
  ],
  mood_struggling: [
    "I noticed your mood changed. Want to talk about what's going on?",
    "Things feeling tough right now? I'm here if you want to talk.",
    "I see you're struggling today. Want to work through this together?",
    "Having a rough time? Let's talk about what's happening.",
    "I'm here for you. Want to share what's making today difficult?"
  ],
  idle_home: [
    "Hey there! How are you doing today?",
    "Hi! Just checking in - how are you feeling?",
    "Hello! Wanted to see how things are going for you.",
    "Hey! How's your day treating you?",
    "Hi there! Just wanted to check in on you."
  ],
  multiple_resets: [
    "I noticed you've had some setbacks. Recovery isn't linear. Want to talk?",
    "Setbacks happen - they're part of the journey. Want to talk about it?",
    "I see you've been struggling lately. Recovery has ups and downs. Need support?",
    "Having some tough days? That's okay. Want to talk through what's happening?",
    "I noticed some relapses recently. You're not alone in this. Want to talk?"
  ],
  no_checkins: [
    "Haven't seen you in a few days. Just checking in - how are you?",
    "It's been a while! Just wanted to see how you're doing.",
    "Hey! Missed you the last few days. Everything okay?",
    "Haven't heard from you lately. Just checking in on you.",
    "Hi! It's been a few days. How have you been?"
  ],
  session_ended: [
    "How was your session? Want to process what came up?",
    "Session done! Want to talk about how it went?",
    "How did that session feel? I'm here if you want to debrief.",
    "Session complete! Want to reflect on what you discussed?",
    "How was that? Want to talk through anything that came up?"
  ],
  progress_milestone: [
    "I see you're checking your progress! You've come so far. Want to celebrate?",
    "Looking at your progress? That's amazing growth! Want to talk about it?",
    "Checking your stats? You should be proud of how far you've come!",
    "Reviewing your journey? There's a lot to be proud of here!",
    "Looking back at your progress? You've made real strides!"
  ],
  progress_struggling: [
    "I noticed some tough days in your history. Want to talk about what helps?",
    "Seeing some challenges in your progress? Let's work on strategies together.",
    "I see you've had some difficult moments. Want to explore patterns?",
    "Looking at the ups and downs? That's part of recovery. Want support?",
    "I notice some struggles in your journey. Want to talk about what triggers them?"
  ]
};

// Get a random message variation (different each time)
function getRandomMessage(category: keyof typeof MESSAGE_VARIATIONS): string {
  const variations = MESSAGE_VARIATIONS[category];
  return variations[Math.floor(Math.random() * variations.length)];
}

// 1. Session Browsing Detection
export async function detectSessionBrowsing(userId: string, durationSeconds: number) {
  if (durationSeconds < 180) return; // Must browse for 3+ minutes

  const userTier = await getUserTier(userId);
  const promptId = 'session_browsing';

  if (!canShowPrompt(promptId, userTier)) return;

  triggerPrompt({
    id: promptId,
    emoji: '💙',
    message: getRandomMessage('session_browsing'),
    actions: [
      { label: 'Yes, help me', action: 'open_chat_context' },
      { label: userTier === 'free' ? 'No, just browsing' : 'No thanks', action: 'dismiss', variant: 'outline' }
    ]
  });
}

// 2. Mood Change Detection
export async function detectMoodChange(
  userId: string,
  fromMood: string,
  toMood: string
) {
  // Only trigger on negative mood changes
  const negativeChanges = [
    { from: 'great', to: 'struggling' },
    { from: 'good', to: 'struggling' },
    { from: 'okay', to: 'struggling' },
    { from: 'great', to: 'okay' },
    { from: 'good', to: 'okay' }
  ];

  const isNegativeChange = negativeChanges.some(
    change => change.from === fromMood && change.to === toMood
  );

  if (!isNegativeChange) return;

  const userTier = await getUserTier(userId);
  const promptId = `mood_change_${toMood}`;

  if (!canShowPrompt(promptId, userTier)) return;

  if (toMood === 'struggling') {
    triggerPrompt({
      id: promptId,
      emoji: '💙',
      message: getRandomMessage('mood_struggling'),
      actions: [
        { label: "Yes, let's talk", action: 'open_chat_context' },
        { label: "No, I'm okay", action: 'dismiss', variant: 'outline' }
      ]
    });
  }
}

// 3. Idle Detection on Home Page
export async function detectIdleOnHome(userId: string, durationSeconds: number) {
  if (durationSeconds < 300) return; // Must be idle for 5+ minutes

  const userTier = await getUserTier(userId);
  const promptId = 'idle_home';

  if (!canShowPrompt(promptId, userTier)) return;

  triggerPrompt({
    id: promptId,
    emoji: '💙',
    message: getRandomMessage('idle_home'),
    actions: [
      { label: "I'm doing okay", action: 'dismiss' },
      { label: 'Not great', action: 'open_chat_context' },
      { label: 'Just looking', action: 'dismiss', variant: 'outline' }
    ]
  });
}

// 4. Multiple Tracker Resets Detection
export async function detectMultipleResets(userId: string) {
  const userTier = await getUserTier(userId);
  const promptId = 'multiple_resets';

  if (!canShowPrompt(promptId, userTier)) return;

  // Check reset count in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: relapses } = await supabase
    .from('tracker_relapses')
    .select('id')
    .eq('user_id', userId)
    .gte('relapse_date', sevenDaysAgo.toISOString());

  if (!relapses || relapses.length < 2) return;

  triggerPrompt({
    id: promptId,
    emoji: '💙',
    message: getRandomMessage('multiple_resets'),
    actions: [
      { label: userTier === 'pro' ? 'Yes, help me understand' : 'Yes, I need support', action: 'open_chat_context' },
      { label: userTier === 'pro' ? 'Not right now' : "No, I'm okay", action: 'dismiss', variant: 'outline' }
    ]
  });
}

// 5. No Check-ins Detection (only checks once per day)
export async function detectNoCheckins(userId: string) {
  const userTier = await getUserTier(userId);
  const promptId = 'no_checkins';

  // Check last check-in first
  const { data: lastCheckin } = await supabase
    .from('daily_checkins')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!lastCheckin) return;

  const daysSince = Math.floor(
    (Date.now() - new Date(lastCheckin.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
  );

  // If user has checked in within 3 days, don't trigger anything
  if (daysSince < 3) return;

  // Check cooldown - only run this check once per day (24 hours)
  const cooldowns = getCooldowns();
  const lastChecked = cooldowns[`${promptId}_checked`];
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  if (lastChecked && Date.now() - lastChecked < oneDayMs) {
    return; // Already checked today, skip
  }

  // Mark that we checked today
  cooldowns[`${promptId}_checked`] = Date.now();
  saveCooldowns(cooldowns);

  // Check if we can show the prompt (respects cooldown)
  if (!canShowPrompt(promptId, userTier)) return;

  triggerPrompt({
    id: promptId,
    emoji: '💙',
    message: getRandomMessage('no_checkins'),
    actions: [
      { label: "I'm okay", action: 'open_chat_context' },
      { label: 'Struggling', action: 'open_chat_context' },
      { label: 'Been busy', action: 'open_chat_context' }
    ]
  });
}

// 6. Post-Session Support
export async function detectSessionEnded(userId: string, sessionId: string, sessionTitle?: string, sessionTopic?: string) {
  const userTier = await getUserTier(userId);
  const promptId = `session_ended_${sessionId}`;

  if (!canShowPrompt(promptId, userTier)) return;

  triggerPrompt({
    id: promptId,
    emoji: '💙',
    message: sessionTitle 
      ? `How was your "${sessionTitle}" session? Want to process what came up?`
      : getRandomMessage('session_ended'),
    actions: [
      { label: "Yes, let's talk", action: 'open_chat_context' },
      { label: "No, I'm good", action: 'dismiss', variant: 'outline' }
    ],
    // Store session info for context
    metadata: { sessionTitle, sessionTopic }
  });
}

// 7. Progress Page - Smart Detection Based on User Data
export async function detectProgressView(userId: string, durationSeconds: number) {
  if (durationSeconds < 30) return; // Must view for 30+ seconds

  const userTier = await getUserTier(userId);
  const promptId = 'progress_view';

  if (!canShowPrompt(promptId, userTier)) return;

  // Analyze user's recent progress
  const { data: recentCheckins } = await supabase
    .from('daily_checkins')
    .select('mood, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(7);

  const { data: trackers } = await supabase
    .from('sobriety_trackers')
    .select('start_date, tracker_name')
    .eq('user_id', userId);

  // Determine if user is doing well or struggling
  const strugglingCount = recentCheckins?.filter(c => c.mood === 'struggling').length || 0;
  const hasLongStreak = trackers?.some(t => {
    const daysSince = Math.floor((Date.now() - new Date(t.start_date).getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= 30; // 30+ days
  });

  // Choose message based on their progress
  let messageType: 'progress_milestone' | 'progress_struggling';
  let actionLabel: string;

  if (hasLongStreak || strugglingCount <= 1) {
    // Doing well - celebrate!
    messageType = 'progress_milestone';
    actionLabel = userTier === 'pro' ? "Yes, let's celebrate!" : "Yes, tell me more!";
  } else {
    // Struggling - offer support
    messageType = 'progress_struggling';
    actionLabel = "Yes, help me understand";
  }

  triggerPrompt({
    id: promptId,
    emoji: hasLongStreak ? '🎉' : '💙',
    message: getRandomMessage(messageType),
    actions: [
      { label: actionLabel, action: 'open_chat_context' },
      { label: "No, just reviewing", action: 'dismiss', variant: 'outline' }
    ]
  });
}

// Helper: Track page time for idle detection
let pageStartTime = Date.now();
let currentPage = '';

export function trackPageView(pathname: string) {
  pageStartTime = Date.now();
  currentPage = pathname;
}

export function getPageDuration(): number {
  return Math.floor((Date.now() - pageStartTime) / 1000);
}

export function getCurrentPage(): string {
  return currentPage;
}
