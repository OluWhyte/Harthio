import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  checkAIMessageLimit, 
  incrementAIMessageUsage,
  formatRateLimitMessage 
} from '@/ai/services/ai-rate-limit-service';
import { getUserTier } from '@/lib/services/tier-service';
import { validateCSRFToken } from '@/lib/csrf-middleware';
import { getSecurityHeaders } from '@/lib/security-utils';

// Hybrid AI Provider Strategy
// Use Groq for critical moments (crisis, struggling, Pro users)
// Use DeepSeek for routine conversations (cost-effective)

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const GROQ_API_KEY = process.env.GROQ_API_KEY_DEV || process.env.GROQ_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY_PROD || process.env.DEEPSEEK_API_KEY;

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEEPSEEK_MODEL = 'deepseek-chat';

// Determine which provider to use based on context
function selectProvider(params: {
  sentiment: 'positive' | 'neutral' | 'negative' | 'crisis';
  interventionType: 'crisis' | 'idle' | 'struggling' | 'session_assist' | 'none';
  userTier: 'free' | 'pro';
}): { url: string; key: string; model: string; provider: 'groq' | 'deepseek' } {
  // Synchronous version - kept for backwards compatibility
  // Use selectProviderWithSettings for admin-controlled provider selection
  const { sentiment, interventionType, userTier } = params;
  
  const useGroq = 
    sentiment === 'crisis' ||
    interventionType === 'crisis' ||
    interventionType === 'struggling' ||
    sentiment === 'negative' ||
    userTier === 'pro';
  
  if (useGroq && GROQ_API_KEY) {
    return {
      url: GROQ_API_URL,
      key: GROQ_API_KEY,
      model: GROQ_MODEL,
      provider: 'groq'
    };
  }
  
  return {
    url: DEEPSEEK_API_URL,
    key: DEEPSEEK_API_KEY || '',
    model: DEEPSEEK_MODEL,
    provider: 'deepseek'
  };
}

// Async version that checks admin settings
async function selectProviderWithSettings(params: {
  sentiment: 'positive' | 'neutral' | 'negative' | 'crisis';
  interventionType: 'crisis' | 'idle' | 'struggling' | 'session_assist' | 'none';
  userTier: 'free' | 'pro';
}): Promise<{ url: string; key: string; model: string; provider: 'groq' | 'deepseek' }> {
  const { sentiment, interventionType, userTier } = params;
  
  // Get admin settings for AI providers
  const { platformSettingsService } = await import('@/lib/services/platform-settings-service');
  const settings = await platformSettingsService.getSettings();
  
  const groqEnabled = settings.aiProviders.groqEnabled;
  const deepseekEnabled = settings.aiProviders.deepseekEnabled;
  
  // Use Groq for critical situations (if enabled)
  const useGroq = 
    sentiment === 'crisis' ||
    interventionType === 'crisis' ||
    interventionType === 'struggling' ||
    sentiment === 'negative' ||
    userTier === 'pro';
  
  if (useGroq && groqEnabled && GROQ_API_KEY) {
    return {
      url: GROQ_API_URL,
      key: GROQ_API_KEY,
      model: GROQ_MODEL,
      provider: 'groq'
    };
  }
  
  // Try DeepSeek if enabled
  if (deepseekEnabled && DEEPSEEK_API_KEY) {
    return {
      url: DEEPSEEK_API_URL,
      key: DEEPSEEK_API_KEY,
      model: DEEPSEEK_MODEL,
      provider: 'deepseek'
    };
  }
  
  // Fallback to Groq if DeepSeek is disabled
  if (groqEnabled && GROQ_API_KEY) {
    return {
      url: GROQ_API_URL,
      key: GROQ_API_KEY,
      model: GROQ_MODEL,
      provider: 'groq'
    };
  }
  
  // If both disabled, throw error
  throw new Error('No AI providers enabled. Please enable at least one provider in admin settings.');
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Simple in-memory cache for AI responses
// Cache common questions to save API calls
interface CacheEntry {
  response: string;
  timestamp: number;
  usage: any;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache
const MAX_CACHE_SIZE = 1000; // Prevent memory bloat

// Pricing per 1M tokens (as of 2025)
const PRICING = {
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 }, // Groq pricing
  'deepseek-chat': { input: 0.14, output: 0.28 } // DeepSeek pricing
};

// Track provider usage for analytics
interface ProviderStats {
  groq: number;
  deepseek: number;
}
const providerUsage: ProviderStats = { groq: 0, deepseek: 0 };

// Calculate cost based on token usage
function calculateCost(model: string, usage: { prompt_tokens: number; completion_tokens: number }): number {
  const pricing = PRICING[model as keyof typeof PRICING];
  if (!pricing) return 0;
  
  const inputCost = (usage.prompt_tokens / 1_000_000) * pricing.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * pricing.output;
  
  return inputCost + outputCost;
}

// Multi-level crisis detection
enum CrisisLevel {
  NONE = 0,
  LOW = 1,      // "feeling hopeless"
  MEDIUM = 2,   // "can't take it anymore"
  HIGH = 3,     // "want to die"
  CRITICAL = 4  // "have a plan", "tonight"
}

function detectCrisisLevel(text: string): CrisisLevel {
  const lowerText = text.toLowerCase();
  
  // CRITICAL - Immediate danger with plan/timeline
  const criticalKeywords = [
    'tonight', 'right now', 'have a plan', 'pills ready',
    'gun loaded', 'wrote note', 'saying goodbye', 'last time'
  ];
  if (criticalKeywords.some(k => lowerText.includes(k)) && 
      (lowerText.includes('kill') || lowerText.includes('die') || lowerText.includes('end'))) {
    return CrisisLevel.CRITICAL;
  }
  
  // HIGH - Direct suicidal ideation
  const highKeywords = [
    'kill myself', 'end it all', 'want to die', 'better off dead',
    'end my life', 'suicide', 'overdose', 'jump off', 'hang myself',
    'gun to my head', 'no reason to live'
  ];
  if (highKeywords.some(k => lowerText.includes(k))) {
    return CrisisLevel.HIGH;
  }
  
  // MEDIUM - Severe distress
  const mediumKeywords = [
    'can\'t take it anymore', 'can\'t go on', 'too much pain',
    'want it to end', 'done with life', 'give up', 'no hope'
  ];
  if (mediumKeywords.some(k => lowerText.includes(k))) {
    return CrisisLevel.MEDIUM;
  }
  
  // LOW - Hopelessness indicators
  const lowKeywords = [
    'hopeless', 'worthless', 'nobody cares', 'world without me',
    'everyone better off', 'hate myself', 'no point'
  ];
  if (lowKeywords.some(k => lowerText.includes(k))) {
    return CrisisLevel.LOW;
  }
  
  return CrisisLevel.NONE;
}

// Detect sentiment from message (Enhanced based on feedback analysis)
function detectSentiment(text: string): 'positive' | 'neutral' | 'negative' | 'crisis' {
  const crisisLevel = detectCrisisLevel(text);
  
  if (crisisLevel >= CrisisLevel.HIGH) {
    return 'crisis';
  }
  
  const lowerText = text.toLowerCase();
  
  // Negative keywords - ENHANCED with more nuanced detection
  const negativeKeywords = [
    // Depression
    'depressed', 'sad', 'hopeless', 'worthless', 'empty',
    'numb', 'dark place', 'can\'t feel', 'no energy',
    // Anxiety
    'anxious', 'panic', 'scared', 'afraid', 'terrified',
    'overwhelmed', 'freaking out', 'can\'t breathe', 'racing heart',
    // Addiction struggles
    'struggling', 'relapse', 'relapsed', 'craving', 'urge',
    'failed', 'messed up', 'used again', 'can\'t stop',
    // Self-worth
    'hate myself', 'worthless', 'failure', 'disappointed',
    'let everyone down', 'not good enough', 'pathetic',
    // Giving up
    'give up', 'can\'t do this', 'too hard', 'impossible'
  ];
  
  const negativeCount = negativeKeywords.filter(keyword => lowerText.includes(keyword)).length;
  
  // Positive keywords - ENHANCED with recovery-specific terms
  const positiveKeywords = [
    // General positive
    'happy', 'grateful', 'better', 'improving', 'proud',
    'accomplished', 'hopeful', 'excited', 'good day',
    // Recovery progress
    'progress', 'sober', 'clean', 'strong', 'confident',
    'milestone', 'achievement', 'breakthrough', 'winning',
    // Coping success
    'handled it', 'got through', 'resisted', 'stayed strong',
    'used my tools', 'reached out', 'asked for help',
    // Optimism
    'looking forward', 'can do this', 'getting better',
    'feeling good', 'positive', 'motivated'
  ];
  
  const positiveCount = positiveKeywords.filter(keyword => lowerText.includes(keyword)).length;
  
  // Weighted scoring (negative feelings are stronger signals)
  if (positiveCount > negativeCount * 1.5) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Extract topics from message (Enhanced with more comprehensive detection)
function extractTopics(text: string): string[] {
  const lowerText = text.toLowerCase();
  const topics: string[] = [];
  
  const topicKeywords = {
    // Mental health
    'anxiety': ['anxiety', 'anxious', 'panic', 'worried', 'nervous', 'stressed out', 'freaking out', 'on edge'],
    'depression': ['depressed', 'depression', 'sad', 'hopeless', 'empty', 'numb', 'dark place', 'no energy'],
    'ptsd': ['trauma', 'ptsd', 'flashback', 'triggered', 'nightmares', 'hypervigilant'],
    'panic_attacks': ['panic attack', 'can\'t breathe', 'heart racing', 'chest tight', 'dizzy', 'losing control'],
    
    // Addiction & recovery
    'addiction': ['addiction', 'addicted', 'substance', 'dependency', 'habit'],
    'alcohol': ['alcohol', 'drinking', 'drunk', 'beer', 'wine', 'liquor', 'booze', 'hangover'],
    'drugs': ['drugs', 'cocaine', 'heroin', 'meth', 'pills', 'weed', 'marijuana', 'opioid', 'fentanyl'],
    'smoking': ['smoking', 'cigarettes', 'tobacco', 'vaping', 'nicotine', 'quit smoking'],
    'gambling': ['gambling', 'betting', 'casino', 'poker', 'slots', 'lost money'],
    'relapse': ['relapse', 'relapsed', 'used again', 'slipped up', 'fell off wagon', 'broke sobriety'],
    'cravings': ['craving', 'urge', 'want to use', 'tempted', 'thinking about using', 'almost relapsed'],
    'sobriety': ['sober', 'clean', 'sobriety', 'recovery', 'staying clean', 'days sober'],
    
    // Relationships
    'relationships': ['relationship', 'partner', 'spouse', 'boyfriend', 'girlfriend', 'marriage'],
    'family': ['family', 'parents', 'mom', 'dad', 'siblings', 'children', 'kids'],
    'loneliness': ['lonely', 'alone', 'isolated', 'no friends', 'nobody understands'],
    'breakup': ['breakup', 'broke up', 'divorce', 'separated', 'ended relationship'],
    
    // Life stressors
    'work_stress': ['work', 'job', 'boss', 'career', 'fired', 'unemployed', 'workplace'],
    'financial': ['money', 'bills', 'debt', 'broke', 'financial', 'can\'t afford', 'rent'],
    'school': ['school', 'college', 'university', 'grades', 'exam', 'studying', 'homework'],
    
    // Physical & lifestyle
    'sleep': ['sleep', 'insomnia', 'tired', 'exhausted', 'can\'t sleep', 'nightmares', 'rest'],
    'eating': ['eating', 'food', 'appetite', 'weight', 'binge', 'starving', 'diet'],
    'exercise': ['exercise', 'workout', 'gym', 'fitness', 'physical activity'],
    
    // Emotions & self
    'self_esteem': ['worthless', 'failure', 'hate myself', 'confidence', 'self-worth', 'not good enough'],
    'anger': ['angry', 'rage', 'furious', 'mad', 'frustrated', 'pissed off', 'irritated'],
    'grief': ['grief', 'loss', 'death', 'died', 'mourning', 'passed away', 'funeral'],
    'guilt': ['guilt', 'guilty', 'ashamed', 'regret', 'remorse', 'feel bad'],
    'fear': ['scared', 'afraid', 'terrified', 'fear', 'frightened', 'phobia'],
    
    // Coping & treatment
    'coping': ['coping', 'cope', 'manage', 'handle', 'deal with', 'get through'],
    'therapy': ['therapy', 'therapist', 'counseling', 'treatment', 'counselor', 'psychologist'],
    'medication': ['medication', 'meds', 'prescription', 'antidepressant', 'ssri', 'psychiatrist'],
    'support_group': ['support group', 'aa', 'na', 'meeting', 'sponsor', '12 step'],
    'self_care': ['self care', 'self-care', 'taking care', 'boundaries', 'rest', 'recharge']
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      topics.push(topic);
    }
  }
  
  return topics;
}

// Detect intervention type (Enhanced for better proactive support)
function detectInterventionType(text: string): 'crisis' | 'idle' | 'struggling' | 'session_assist' | 'none' {
  const lowerText = text.toLowerCase();
  
  // Crisis detection (highest priority)
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'overdose', 'self harm',
    'want to die', 'can\'t go on', 'no point', 'better off dead',
    'gun to my head', 'jump off', 'hang myself'
  ];
  if (crisisKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'crisis';
  }
  
  // Struggling pattern (needs immediate support)
  const strugglingKeywords = [
    'struggling', 'can\'t cope', 'overwhelmed', 'breaking down',
    'falling apart', 'losing it', 'can\'t handle', 'too much',
    'about to relapse', 'strong craving', 'can\'t resist',
    'need help now', 'desperate', 'at my limit'
  ];
  if (strugglingKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'struggling';
  }
  
  // Session assist (wants to connect with others)
  const sessionKeywords = [
    'find session', 'join session', 'looking for', 'want to talk',
    'need someone', 'talk to someone', 'find people', 'connect with',
    'support group', 'peer support', 'others like me'
  ];
  if (sessionKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'session_assist';
  }
  
  return 'none';
}

// Optimize conversation history for long conversations
function optimizeConversationHistory(messages: ChatMessage[], systemPrompt: string): ChatMessage[] {
  // If conversation is short, return as-is
  if (messages.length <= 12) return messages;
  
  // Keep last 10 messages (recent context)
  const recentMessages = messages.slice(-10);
  
  // Summarize older messages
  const oldMessages = messages.slice(0, -10);
  
  // Extract key information from old messages
  const topics = new Set<string>();
  const techniques = new Set<string>();
  let hadCrisis = false;
  let hadRelapse = false;
  
  oldMessages.forEach(msg => {
    if (msg.role === 'user') {
      const lower = msg.content.toLowerCase();
      
      // Detect topics
      if (lower.includes('anxiety') || lower.includes('anxious')) topics.add('anxiety');
      if (lower.includes('depress')) topics.add('depression');
      if (lower.includes('craving')) topics.add('cravings');
      if (lower.includes('relapse')) {
        topics.add('relapse');
        hadRelapse = true;
      }
      if (lower.includes('family')) topics.add('family');
      if (lower.includes('work')) topics.add('work');
      
      // Detect crisis
      if (lower.includes('suicide') || lower.includes('kill myself')) hadCrisis = true;
      
      // Detect techniques used
      if (lower.includes('breathing')) techniques.add('breathing');
      if (lower.includes('grounding')) techniques.add('grounding');
    }
  });
  
  // Create summary message
  let summary = 'Previous conversation summary:\n';
  if (topics.size > 0) summary += `Topics: ${Array.from(topics).join(', ')}\n`;
  if (techniques.size > 0) summary += `Techniques tried: ${Array.from(techniques).join(', ')}\n`;
  if (hadCrisis) summary += 'Note: User experienced crisis earlier\n';
  if (hadRelapse) summary += 'Note: User discussed relapse\n';
  
  const summaryMessage: ChatMessage = {
    role: 'system',
    content: summary
  };
  
  return [summaryMessage, ...recentMessages];
}

// Generate cache key from messages
function getCacheKey(messages: ChatMessage[]): string {
  // Only cache if it's a simple question (last user message only)
  const lastUserMsg = messages.filter(m => m.role === 'user').pop();
  if (!lastUserMsg) return '';
  
  // Normalize the message for better cache hits
  const normalized = lastUserMsg.content
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
  
  // Only cache short, common questions (likely to be repeated)
  if (normalized.length > 100) return ''; // Don't cache long messages
  
  return normalized;
}

// Clean expired cache entries
function cleanCache() {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }
  
  // If cache is too large, remove oldest entries
  if (responseCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(responseCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => responseCache.delete(key));
  }
}

// Generate user activity summary for personalization
async function generateActivitySummary(userId: string, supabase: any): Promise<string> {
  try {
    console.log('[AI] Generating activity summary for user:', userId);
    
    // Fetch user data in parallel for speed
    const [trackersResult, checkInsResult, sessionsResult] = await Promise.all([
      // Get trackers
      supabase
        .from('sobriety_trackers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      
      // Get recent check-ins (last 7 days)
      supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false }),
      
      // Get recent sessions (last 30 days)
      supabase
        .from('topics')
        .select('*')
        .or(`author_id.eq.${userId},participants.cs.{${userId}}`)
        .gte('end_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('end_time', { ascending: false })
    ]);

    // Log what we got from database
    console.log('[AI] Trackers found:', trackersResult.data?.length || 0);
    console.log('[AI] Check-ins found:', checkInsResult.data?.length || 0);
    console.log('[AI] Sessions found:', sessionsResult.data?.length || 0);
    
    if (trackersResult.error) console.error('[AI] Tracker error:', trackersResult.error);
    if (checkInsResult.error) console.error('[AI] Check-in error:', checkInsResult.error);
    if (sessionsResult.error) console.error('[AI] Session error:', sessionsResult.error);
    
    const currentDate = new Date();
    const fullDateString = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    let summary = '\n\nUSER ACTIVITY CONTEXT:\n';
    
    // Trackers (JSON format for efficiency)
    if (trackersResult.data && trackersResult.data.length > 0) {
      summary += 'Trackers: [\n';
      
      trackersResult.data.forEach((tracker: any, index: number) => {
        const startDate = new Date(tracker.start_date);
        const today = new Date();
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffTime = todayDateOnly.getTime() - startDateOnly.getTime();
        const daysSober = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        summary += `  {name: "${tracker.tracker_name}", type: "${tracker.tracker_type}", days: ${daysSober}}${index < trackersResult.data.length - 1 ? ',' : ''}\n`;
      });
      
      summary += ']\n';
    } else {
      summary += 'Trackers: []\n';
    }
    
    // Check-ins (JSON format)
    if (checkInsResult.data && checkInsResult.data.length > 0) {
      const moods = checkInsResult.data.map((c: any) => c.mood);
      const strugglingCount = moods.filter((m: string) => m === 'struggling').length;
      const goodCount = moods.filter((m: string) => m === 'good' || m === 'great').length;
      const lastCheckIn = checkInsResult.data[0];
      const lastCheckInDate = new Date(lastCheckIn.created_at);
      const daysAgo = Math.floor((currentDate.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24));
      
      summary += `CheckIns (7d): {total: ${checkInsResult.data.length}, struggling: ${strugglingCount}, good: ${goodCount}, last: "${lastCheckIn.mood}" ${daysAgo}d ago}\n`;
    } else {
      summary += 'CheckIns: None\n';
    }
    
    // Sessions
    if (sessionsResult.data && sessionsResult.data.length > 0) {
      summary += `Sessions (30d): ${sessionsResult.data.length}\n`;
    } else {
      summary += 'Sessions: 0\n';
    }
    
    summary += '\nUse exact numbers above. Reference naturally. Celebrate wins.\n';
    
    return summary;
  } catch (error) {
    console.error('Error generating activity summary:', error);
    return '\n\n**USER ACTIVITY CONTEXT:** Unable to load user activity data.\n';
  }
}

// Get tier-specific system prompt (OPTIMIZED - 50% token reduction)
function getTierSystemPrompt(tier: 'free' | 'pro', currentDate?: string): string {
  const dateInfo = currentDate ? `CONTEXT: Today is ${currentDate}. User data provided in USER ACTIVITY CONTEXT below. Use exact numbers provided - don't calculate.\n\n` : '';
  
  const basePrompt = `${dateInfo}ROLE: Harthio AI - recovery companion (friend, not therapist)

TONE: Conversational, supportive, direct
- Use contractions, vary openings, 2-3 sentences default
- Avoid: "I hear you" (max 1x), therapist language, over-explaining
- Max 1 emoji per response

CRITICAL - TEXT FORMATTING:
- NEVER use markdown: no **, __, *, #, -, •, or any formatting symbols
- NEVER use bullet points or lists
- NEVER use headers or bold text
- Write like you're texting a friend - plain text only
- Use line breaks for separation, not symbols

MEMORY: Reference previous conversation. Notice patterns. Follow up on topics.

EMOTIONAL INTELLIGENCE (Critical - Study these):

Relapse:
❌ "Relapse is a normal part of recovery. Many people experience this."
✅ "Hey, you're not a failure. You made it X days - that's real progress. What happened?"

Milestone:
❌ "That's great! Keep up the good work."
✅ "Hell yeah! 47 days is huge. How are you feeling about it?"

Crisis/Craving:
❌ "I understand you're struggling. Have you tried coping techniques?"
✅ "That's a tough spot. What's going on right now? Can you call your sponsor?"

Hopelessness:
❌ "Things will get better. You need to stay positive."
✅ "I hear you. Recovery is hard as hell. What's one small thing that might help today?"

Anxiety:
❌ "Anxiety is your body's alarm system. Let me explain the science."
✅ "Anxiety sucks. Want to try something quick that might calm things down?"

Self-blame:
❌ "You shouldn't be so hard on yourself."
✅ "You're being really tough on yourself. What would you tell a friend in this situation?"

FORMATTING REMINDER:
❌ "Here are **three things**: • Breathing • Grounding • Walking"
✅ "Here are three things: breathing, grounding, or walking"

CRISIS: If suicide/self-harm → Express concern, provide 988, be brief.`;

  if (tier === 'free') {
    return basePrompt + `

TIER: FREE
Available: Support, crisis resources, breathing (4-4-6)
Pro only: CBT tools, pattern analysis, advanced techniques

When user needs Pro feature:
"I'd love to help with that! [Feature] is a Pro feature. With Pro you get full CBT tools, unlimited conversations, and advanced tracking for $9.99/month. Want to start a 14-day free trial? For now, I can help with [free alternative]."

Be warm, not salesy.`;
  }

  return basePrompt + `

TIER: PRO (Full Access)
All features available: CBT tools, pattern analysis, unlimited support.`;
}

export async function POST(request: NextRequest) {
  try {
    // 0. CSRF Protection
    const csrfValid = validateCSRFToken(request);
    if (!csrfValid) {
      return NextResponse.json(
        { error: 'CSRF validation failed', message: 'Security check failed. Please refresh and try again.' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // 1. Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Supabase client with user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check user tier
    const userTier = await getUserTier(user.id);

    // 3. Check rate limit (pass authenticated client for RLS)
    const rateLimit = await checkAIMessageLimit(user.id, supabase);

    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'rate_limit_exceeded',
        message: formatRateLimitMessage(rateLimit, 'message'),
        remaining: rateLimit.remaining,
        limit: rateLimit.limit,
        resetTime: rateLimit.resetTime,
        userTier: rateLimit.userTier
      }, { status: 429 });
    }

    const body = await request.json();
    console.log('[AI Chat] Request body:', JSON.stringify(body, null, 2));
    
    const { messages, context } = body;

    // Input validation constants
    const MAX_MESSAGE_LENGTH = 2000;
    const MAX_MESSAGES = 50;
    const MAX_TOTAL_SIZE = 50000;

    // Validate messages array
    if (!messages || !Array.isArray(messages)) {
      console.error('[AI Chat] Invalid messages format:', { 
        messages, 
        type: typeof messages,
        hasMessages: !!messages,
        isArray: Array.isArray(messages),
        fullBody: body
      });
      return NextResponse.json(
        { error: 'Invalid messages format', details: 'Messages must be an array' },
        { status: 400 }
      );
    }

    // Validate message count
    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json(
        { error: `Too many messages. Maximum ${MAX_MESSAGES} allowed.` },
        { status: 400 }
      );
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.content || typeof msg.content !== 'string') {
        console.error('[AI Chat] Invalid message format:', { msg, hasContent: !!msg.content, contentType: typeof msg.content });
        return NextResponse.json(
          { error: 'Invalid message format', details: 'Each message must have a content string' },
          { status: 400 }
        );
      }

      // Only validate user messages length (system prompts can be longer)
      if (msg.role === 'user' && msg.content.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json(
          { error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.` },
          { status: 400 }
        );
      }
    }

    // Validate total conversation size
    const totalSize = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: 'Conversation too large. Please start a new conversation.' },
        { status: 400 }
      );
    }

    // 4. Detect sentiment and topics EARLY (needed for provider selection)
    const userMessage = messages[messages.length - 1]?.content || '';
    const sentiment = detectSentiment(userMessage);
    const topics = extractTopics(userMessage);
    const interventionType = detectInterventionType(userMessage);
    
    // 5. Select AI provider based on context (HYBRID APPROACH with admin settings)
    const provider = await selectProviderWithSettings({ sentiment, interventionType, userTier });
    
    if (!provider.key) {
      console.error(`${provider.provider.toUpperCase()}_API_KEY not configured`);
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }
    
    // Log provider selection (for monitoring)
    console.log(`[AI] Provider: ${provider.provider.toUpperCase()} | Tier: ${userTier} | Sentiment: ${sentiment} | Intervention: ${interventionType}`);
    providerUsage[provider.provider]++;
    
    // 6. Generate user activity summary for personalization
    const activitySummary = await generateActivitySummary(user.id, supabase);
    
    // 6.5. Get user personalization preferences
    const { AIPersonalizationService } = await import('@/ai/services/ai-personalization-service');
    const personalizationPrompt = await AIPersonalizationService.getPersonalizationPrompt(user.id);
    
    // 7. Add tier-specific system prompt with user context
    const currentDate = new Date();
    const fullDateString = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const baseSystemPrompt = getTierSystemPrompt(userTier, fullDateString);
    const systemPrompt = baseSystemPrompt + personalizationPrompt + activitySummary;
    
    // Optimize conversation history for long conversations
    const optimizedMessages = optimizeConversationHistory(messages, systemPrompt);
    
    // Prepend system message if not already present
    let messagesWithSystem: ChatMessage[] = optimizedMessages[0]?.role === 'system'
      ? optimizedMessages
      : [{ role: 'system', content: systemPrompt }, ...optimizedMessages];
    
    // NUCLEAR OPTION: If this is the first user message, inject data reminder
    if (messagesWithSystem.filter(m => m.role === 'user').length === 1) {
      const firstUserIndex = messagesWithSystem.findIndex(m => m.role === 'user');
      if (firstUserIndex > 0) {
        // Insert a system reminder right before first user message
        messagesWithSystem.splice(firstUserIndex, 0, {
          role: 'system',
          content: `REMINDER: You have access to user data. Check the USER ACTIVITY CONTEXT section above. Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`
        });
      }
    }

    // 8. Check cache first (save API calls!)
    // NOTE: Caching disabled temporarily for testing - tracker days were getting stale
    // TODO: Re-enable with proper cache invalidation when tracker data changes
    const cacheKey = ''; // Disabled
    
    if (cacheKey) {
      const cached = responseCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        console.log(`[AI] Cache HIT for: "${String(cacheKey).substring(0, 50)}..."`);
        
        // Still increment usage for tracking (but no API cost)
        await incrementAIMessageUsage(user.id, supabase);
        const updatedRateLimit = await checkAIMessageLimit(user.id, supabase);
        
        return NextResponse.json({
          message: cached.response,
          usage: cached.usage,
          cached: true,
          provider: provider.provider,
          rateLimit: {
            remaining: updatedRateLimit.remaining,
            limit: updatedRateLimit.limit,
            resetTime: updatedRateLimit.resetTime,
            userTier: updatedRateLimit.userTier
          }
        });
      }
    }

    // 9. Call AI API (Groq for critical, DeepSeek for routine)
    console.log(`[AI] Cache MISS - Calling ${provider.provider.toUpperCase()} API with ${provider.model}`);
    console.log(`[AI] System prompt length:`, systemPrompt.length);
    console.log(`[AI] System prompt preview:`, systemPrompt.substring(0, 200));
    
    // Track response time
    const startTime = Date.now();
    let apiError: string | null = null;
    
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.key}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: messagesWithSystem,
        temperature: 0.7,
        max_tokens: 500, // Keep responses concise
        stream: false,
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      apiError = `${response.status}: ${errorText}`;
      console.error(`${provider.provider.toUpperCase()} API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      // Track API error in database
      try {
        await supabase.from('ai_chat_history').insert({
          user_id: user.id,
          role: 'assistant',
          content: 'API Error',
          response_time_ms: responseTime,
          api_error: apiError,
          model_used: provider.model,
          ai_provider: provider.provider
        });
      } catch (e) {
        console.error('Failed to log API error:', e);
      }
      
      // Fallback: Try the other provider if one fails
      if (provider.provider === 'groq' && DEEPSEEK_API_KEY) {
        console.log('[AI] Groq failed, falling back to DeepSeek...');
        const fallbackProvider = {
          url: DEEPSEEK_API_URL,
          key: DEEPSEEK_API_KEY,
          model: DEEPSEEK_MODEL,
          provider: 'deepseek' as const
        };
        
        const fallbackResponse = await fetch(fallbackProvider.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${fallbackProvider.key}`,
          },
          body: JSON.stringify({
            model: fallbackProvider.model,
            messages: messagesWithSystem,
            temperature: 0.7,
            max_tokens: 500,
            stream: false,
          }),
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const aiMessage = fallbackData.choices[0].message.content;
          const usage = fallbackData.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
          const cost = calculateCost(fallbackProvider.model, usage);
          
          // Save with fallback indicator
          await supabase.from('ai_chat_history').insert({
            user_id: user.id,
            role: 'assistant',
            content: aiMessage,
            response_time_ms: Date.now() - startTime,
            token_count: usage.total_tokens,
            model_used: fallbackProvider.model,
            ai_provider: fallbackProvider.provider,
            cost_usd: cost,
            sentiment: sentiment,
            topic_tags: topics.length > 0 ? topics : null,
            intervention_type: interventionType
          });
          
          await incrementAIMessageUsage(user.id, supabase);
          const updatedRateLimit = await checkAIMessageLimit(user.id, supabase);
          
          return NextResponse.json({
            message: aiMessage,
            usage: fallbackData.usage,
            cached: false,
            provider: 'deepseek (fallback)',
            sessionId: context?.sessionId || crypto.randomUUID(),
            rateLimit: {
              remaining: updatedRateLimit.remaining,
              limit: updatedRateLimit.limit,
              resetTime: updatedRateLimit.resetTime,
              userTier: updatedRateLimit.userTier
            }
          });
        }
      }
      
      return NextResponse.json(
        { 
          error: 'AI service error',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;
    
    // 10. Calculate cost based on token usage
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const cost = calculateCost(provider.model, usage);
    
    // 11. Save to chat history with comprehensive tracking
    try {
      // Generate or reuse session ID
      const sessionId = context?.sessionId || crypto.randomUUID();
      
      // Save user message
      await supabase.from('ai_chat_history').insert({
        user_id: user.id,
        role: 'user',
        content: userMessage,
        session_id: sessionId,
        sentiment: sentiment,
        topic_tags: topics.length > 0 ? topics : null,
        intervention_type: interventionType
      });
      
      // Save AI response with full metrics (including provider)
      await supabase.from('ai_chat_history').insert({
        user_id: user.id,
        role: 'assistant',
        content: aiMessage,
        session_id: sessionId,
        response_time_ms: responseTime,
        token_count: usage.total_tokens,
        model_used: provider.model,
        ai_provider: provider.provider,
        cost_usd: cost,
        api_error: apiError,
        sentiment: sentiment,
        topic_tags: topics.length > 0 ? topics : null,
        intervention_type: interventionType
      });
    } catch (error) {
      console.error('Failed to save chat history:', error);
      // Don't fail the request if history save fails
    }
    
    // 12. Cache the response if it's cacheable
    if (cacheKey && aiMessage) {
      responseCache.set(cacheKey, {
        response: aiMessage,
        timestamp: Date.now(),
        usage: data.usage
      });
      cleanCache(); // Periodic cleanup
    }
    
    // 13. Increment usage counter (deduct credits or increment daily count)
    await incrementAIMessageUsage(user.id, supabase);

    // 14. Get updated rate limit info
    const updatedRateLimit = await checkAIMessageLimit(user.id, supabase);
    
    // 15. Log provider usage stats periodically
    if ((providerUsage.groq + providerUsage.deepseek) % 100 === 0) {
      const total = providerUsage.groq + providerUsage.deepseek;
      const groqPercent = ((providerUsage.groq / total) * 100).toFixed(1);
      const deepseekPercent = ((providerUsage.deepseek / total) * 100).toFixed(1);
      console.log(`[AI] Provider Usage: Groq ${groqPercent}% (${providerUsage.groq}) | DeepSeek ${deepseekPercent}% (${providerUsage.deepseek})`);
    }
    
    return NextResponse.json({
      message: aiMessage,
      usage: data.usage,
      cached: false,
      provider: provider.provider,
      sessionId: context?.sessionId || crypto.randomUUID(),
      rateLimit: {
        remaining: updatedRateLimit.remaining,
        limit: updatedRateLimit.limit,
        resetTime: updatedRateLimit.resetTime,
        userTier: updatedRateLimit.userTier
      }
    });

  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
