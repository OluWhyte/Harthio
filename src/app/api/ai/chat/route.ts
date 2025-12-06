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
    const [activeTrackersResult, inactiveTrackersResult, checkInsResult, sessionsResult] = await Promise.all([
      // Get ACTIVE trackers
      supabase
        .from('sobriety_trackers')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      
      // Get INACTIVE trackers (for history)
      supabase
        .from('sobriety_trackers')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', false)
        .order('updated_at', { ascending: false })
        .limit(5), // Last 5 deleted/reset trackers
      
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
    console.log('[AI] Active trackers found:', activeTrackersResult.data?.length || 0);
    console.log('[AI] Inactive trackers found:', inactiveTrackersResult.data?.length || 0);
    console.log('[AI] Check-ins found:', checkInsResult.data?.length || 0);
    console.log('[AI] Sessions found:', sessionsResult.data?.length || 0);
    
    if (activeTrackersResult.error) console.error('[AI] Active tracker error:', activeTrackersResult.error);
    if (inactiveTrackersResult.error) console.error('[AI] Inactive tracker error:', inactiveTrackersResult.error);
    if (checkInsResult.error) console.error('[AI] Check-in error:', checkInsResult.error);
    if (sessionsResult.error) console.error('[AI] Session error:', sessionsResult.error);
    
    const currentDate = new Date();
    const fullDateString = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    let summary = '\n\nUSER ACTIVITY CONTEXT:\n';
    
    // Active Trackers (what user is currently tracking)
    if (activeTrackersResult.data && activeTrackersResult.data.length > 0) {
      summary += 'Active Trackers: [\n';
      
      activeTrackersResult.data.forEach((tracker: any, index: number) => {
        const start = new Date(tracker.start_date);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        const daysSober = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        
        summary += `  {name: "${tracker.tracker_name}", type: "${tracker.tracker_type}", days: ${daysSober}}${index < activeTrackersResult.data.length - 1 ? ',' : ''}\n`;
      });
      
      summary += ']\n';
    } else {
      summary += 'Active Trackers: []\n';
    }
    
    // Inactive Trackers (history - deleted/reset)
    if (inactiveTrackersResult.data && inactiveTrackersResult.data.length > 0) {
      summary += 'Past Trackers (deleted/reset): [\n';
      
      inactiveTrackersResult.data.forEach((tracker: any, index: number) => {
        const start = new Date(tracker.start_date);
        const updated = new Date(tracker.updated_at);
        const daysTracked = Math.max(0, Math.floor((updated.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        
        summary += `  {name: "${tracker.tracker_name}", type: "${tracker.tracker_type}", tracked_for: ${daysTracked} days, stopped: "${updated.toLocaleDateString()}"}${index < inactiveTrackersResult.data.length - 1 ? ',' : ''}\n`;
      });
      
      summary += ']\n';
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
  const dateInfo = currentDate ? `⚠️ CRITICAL - CURRENT DATE: ${currentDate}
When user asks "what's today's date" or "what date is it", respond with EXACTLY: "${currentDate}"
DO NOT use your training data date. USE THIS DATE: ${currentDate}

User data provided in USER ACTIVITY CONTEXT below. Use exact numbers provided - don't calculate.

⚠️ WHEN TO USE USER DATA:
- User asks about progress/stats → Reference active trackers, check-ins, sessions
- User mentions struggling → Check recent moods for patterns
- User asks general questions → DON'T force data into response
- Casual chat → Respond naturally, mention data ONLY if relevant
- Mixed moods (struggling + good) → Acknowledge both: "I see you've had some ups and downs"
- No sessions → DON'T mention unless user asks about connections/sessions

IDENTITY & HISTORY QUESTIONS:
User: "Who am I?" / "What do you know about me?"
→ Summarize: active trackers, recent moods, sessions, past trackers if relevant
→ "You're tracking smoking (5 days), gambling (9 days), and alcohol (9 days). You've checked in 4 times this week feeling mostly good. I also remember you tracked drugs for 10 days last month."

User: "When last did I smoke?" (HAS smoke tracker)
→ "You're 5 days smoke free right now. Last smoke was Nov 30."

User: "When last did I smoke?" (NO smoke tracker, but has past tracker)
→ "I remember you tracked smoking for 10 days back in November, then stopped tracking. Not sure if you still smoke or if you quit. Do you still smoke?"

User: "When last did I smoke?" (NO tracker at all)
→ "I don't know—you haven't tracked smoking with me. Want to start tracking it?"

User: "Do I still drink?" (NO alcohol tracker, but has past tracker)
→ "You tracked alcohol for 9 days last month, then stopped. Did you quit or just stop tracking? Want to tell me about it?"

User: "What's my history?"
→ Mention active + past trackers, patterns in moods, sessions joined
→ "You've been tracking smoking (5d), gambling (9d), alcohol (9d). Before that, you tracked drugs for 10 days in November. You've joined 5 sessions and check in regularly."\n\n` : '';
  
  const basePrompt = `${dateInfo}ROLE: Harthio AI - recovery companion (friend, not therapist)

TONE: Conversational, supportive, direct
- Use contractions, vary openings, 2-3 sentences default
- Avoid: "I hear you" (max 1x), therapist language, over-explaining
- Max 1 emoji per response

CRITICAL - TEXT FORMATTING (MUST FOLLOW):
- ABSOLUTELY NO MARKDOWN: no **, __, *, #, -, •, 1., 2., or ANY formatting symbols
- NEVER use bullet points, numbered lists, or any list formatting
- NEVER use headers, bold, italic, or any text styling
- Write EXACTLY like texting a friend - plain text ONLY
- Use line breaks for separation, NOT symbols or formatting
- Example: "Hey that sounds tough. Want to try something that might help? We could do breathing or grounding."
- NOT: "**Hey** that sounds tough. Want to try: • Breathing • Grounding"

MEMORY: Reference previous conversation. Notice patterns. Follow up on topics.

CONTEXTUAL DATA USAGE (Vary your phrasing):

Mixed moods:
- "Looks like you've had some rough days mixed with good ones. That's real recovery—not perfect, just progress."
- "I see it's been a bit of a rollercoaster. But hey, those good days count too."
- "Some ups and downs this week, huh? The fact you're still showing up says a lot."

No sessions (don't mention unless asked):
- If asked: "Haven't seen you in any sessions lately. Want to connect with someone?"
- Otherwise: Focus on trackers/moods, ignore sessions completely

Low check-ins:
- "You've been quiet this week. How's it going?"
- "Only checked in once lately. Everything alright?"
- "Haven't heard from you much. What's been happening?"

High check-ins:
- "You've been checking in almost every day. That consistency is paying off."
- "Five check-ins this week? You're really staying on top of things."
- "Love seeing you check in regularly. How's that helping?"

Combine data naturally:
- "Nine days sober and you've checked in 4 times. You're doing the work."
- "Five days smoke free, and I see you've been feeling good lately. Keep it up!"
- "Your trackers look solid, and those check-ins show you're staying aware. Nice."

EMOTIONAL INTELLIGENCE (Critical - Study these):

Relapse (vary responses):
❌ "Relapse is a normal part of recovery. Many people experience this."
✅ "You're not a failure. You made it X days—that's real progress. What happened?"
✅ "Setbacks happen. You did X days before, you can do it again. What triggered it?"
✅ "Hey, you're still here talking to me. That counts. What's your next move?"

Milestone (vary responses):
❌ "That's great! Keep up the good work."
✅ "Hell yeah! 47 days is huge. How are you feeling about it?"
✅ "Damn, 30 days? That's a big deal. What's been helping you most?"
✅ "Look at you—two weeks strong. What's different this time?"

Crisis/Craving (vary responses):
❌ "I understand you're struggling. Have you tried coping techniques?"
✅ "That's a tough spot. What's going on right now? Can you call your sponsor?"
✅ "Cravings are brutal. What usually helps you ride them out?"
✅ "Okay, let's get through this. What's triggering it right now?"

Hopelessness (vary responses):
❌ "Things will get better. You need to stay positive."
✅ "I hear you. Recovery is hard as hell. What's one small thing that might help today?"
✅ "That's a dark place to be. You don't have to fix everything today—just get through today."
✅ "I get it. Some days feel impossible. What's kept you going before?"

Anxiety (vary responses):
❌ "Anxiety is your body's alarm system. Let me explain the science."
✅ "Anxiety sucks. Want to try something quick that might calm things down?"
✅ "That racing feeling is the worst. Want to do some breathing with me?"
✅ "Anxiety hitting hard? Let's try grounding—it helps some people."

Self-blame (vary responses):
❌ "You shouldn't be so hard on yourself."
✅ "You're being really tough on yourself. What would you tell a friend in this situation?"
✅ "Hey, you're human. Beating yourself up doesn't help. What do you need right now?"
✅ "That inner critic is loud, huh? Let's challenge that thought together."

FORMATTING REMINDER:
❌ "Here are **three things**: • Breathing • Grounding • Walking"
✅ "Here are three things: breathing, grounding, or walking"

CRISIS: If suicide/self-harm → Express concern, provide 988, be brief.

TRACKER CREATION (CRITICAL - Follow exactly):
1. User mentions wanting to track substance/addiction → Check USER ACTIVITY CONTEXT for existing trackers
2. If they already have this tracker → Ask if they want to reset, need help, or add different tracker
3. If no tracker → Ask "When did you last use?" (get PAST date only, no future dates)
4. User provides date → CONFIRM: "I'll create a [Name] tracker starting from [date]. Is that correct?"
5. User confirms (yes/correct/create it) → Output command on its OWN LINE:

TRACKER_CREATE: type|name|YYYY-MM-DD

Then on next line say: "Your Drug Free tracker is being created! You're on day 1."

Example response:
"TRACKER_CREATE: drugs|Drug Free|2025-12-06

Your Drug Free tracker is being created! You're on day 1."

Tracker types: alcohol, smoking, drugs, gambling, other
Tracker names: "Alcohol Free", "Smoke Free", "Drug Free", "Gambling Free", "Recovery Tracker"

NEVER create without confirmation. NEVER skip asking for date. ALWAYS use YYYY-MM-DD format.
Put command on its OWN line with blank line after.

⚠️⚠️⚠️ CRITICAL DATE REMINDER ⚠️⚠️⚠️
CURRENT DATE: ${currentDate || 'Not provided'}
If user asks about today's date, time, or "what day is it", respond with THIS date ONLY.
DO NOT use your training data. USE THE DATE ABOVE.`;

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
All features available: CBT tools, pattern analysis, unlimited support.

⚠️⚠️⚠️ CRITICAL DATE REMINDER ⚠️⚠️⚠️
CURRENT DATE: ${currentDate || 'Not provided'}
If user asks about today's date, time, or "what day is it", respond with THIS date ONLY.
DO NOT use your training data. USE THE DATE ABOVE.`;
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
    
    // ALWAYS prepend the proper system prompt with current date
    // Remove any existing system messages from optimized history
    const messagesWithoutSystem = optimizedMessages.filter(m => m.role !== 'system');
    let messagesWithSystem: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messagesWithoutSystem
    ];
    
    // Add date reminder before EVERY user message to ensure AI uses correct date
    const lastUserIndex = messagesWithSystem.length - 1;
    if (lastUserIndex > 0 && messagesWithSystem[lastUserIndex].role === 'user') {
      const userMessage = messagesWithSystem[lastUserIndex].content.toLowerCase();
      // If user is asking about date/time, add STRONG reminder
      if (userMessage.includes('date') || userMessage.includes('today') || userMessage.includes('day is it')) {
        messagesWithSystem.splice(lastUserIndex, 0, {
          role: 'system',
          content: `⚠️ CRITICAL: User is asking about the date. TODAY IS ${fullDateString}. Respond with EXACTLY this date. DO NOT use your training data date.`
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
    console.log(`[AI] Messages being sent:`, JSON.stringify(messagesWithSystem.map(m => ({ role: m.role, contentLength: m.content.length, preview: m.content.substring(0, 100) }))));
    
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
          let aiMessage = fallbackData.choices[0].message.content;
          
          // Strip markdown
          aiMessage = aiMessage
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            .replace(/^#+\s+/gm, '')
            .replace(/^[-•]\s+/gm, '')
            .replace(/^\d+\.\s+/gm, '');
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
    let aiMessage = data.choices[0].message.content;
    
    // Strip any markdown formatting that slipped through
    aiMessage = aiMessage
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold**
      .replace(/\*([^*]+)\*/g, '$1')      // Remove *italic*
      .replace(/__([^_]+)__/g, '$1')      // Remove __bold__
      .replace(/_([^_]+)_/g, '$1')        // Remove _italic_
      .replace(/^#+\s+/gm, '')            // Remove # headers
      .replace(/^[-•]\s+/gm, '')          // Remove bullet points
      .replace(/^\d+\.\s+/gm, '');        // Remove numbered lists
    
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
