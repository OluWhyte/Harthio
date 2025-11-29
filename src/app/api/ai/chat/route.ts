import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  checkAIMessageLimit, 
  incrementAIMessageUsage,
  formatRateLimitMessage 
} from '@/ai/services/ai-rate-limit-service';
import { getUserTier } from '@/lib/services/tier-service';

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
  const { sentiment, interventionType, userTier } = params;
  
  // FORCE GROQ FOR TESTING - Set to true to always use Groq
  const FORCE_GROQ = true; // Using Groq free credits for testing
  
  if (FORCE_GROQ && GROQ_API_KEY) {
    return {
      url: GROQ_API_URL,
      key: GROQ_API_KEY,
      model: GROQ_MODEL,
      provider: 'groq'
    };
  }
  
  // Use Groq for critical situations (best quality when it matters)
  const useGroq = 
    sentiment === 'crisis' ||
    interventionType === 'crisis' ||
    interventionType === 'struggling' ||
    sentiment === 'negative' ||
    userTier === 'pro'; // Pro users get premium experience
  
  if (useGroq && GROQ_API_KEY) {
    return {
      url: GROQ_API_URL,
      key: GROQ_API_KEY,
      model: GROQ_MODEL,
      provider: 'groq'
    };
  }
  
  // Default to DeepSeek (cost-effective for routine conversations)
  return {
    url: DEEPSEEK_API_URL,
    key: DEEPSEEK_API_KEY || '',
    model: DEEPSEEK_MODEL,
    provider: 'deepseek'
  };
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

// Detect sentiment from message (Enhanced based on feedback analysis)
function detectSentiment(text: string): 'positive' | 'neutral' | 'negative' | 'crisis' {
  const lowerText = text.toLowerCase();
  
  // Crisis keywords (highest priority) - ENHANCED with more patterns
  const crisisKeywords = [
    // Direct suicidal ideation
    'suicide', 'kill myself', 'end it all', 'no point living',
    'want to die', 'better off dead', 'end my life',
    // Self-harm
    'overdose', 'self harm', 'cut myself', 'hurt myself',
    // Hopelessness indicators
    'can\'t go on', 'too much pain', 'nobody cares',
    'world without me', 'everyone better off', 'no reason to live',
    // Immediate danger
    'gun to my head', 'jump off', 'hang myself', 'pills ready',
    // Severe distress
    'can\'t take it anymore', 'want it to end', 'done with life'
  ];
  
  if (crisisKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'crisis';
  }
  
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
    const dateString = currentDate.toISOString().split('T')[0];
    const fullDateString = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    let summary = '\n\n═══════════════════════════════════════\n';
    summary += '📅 TODAY IS: ' + fullDateString + '\n';
    summary += '═══════════════════════════════════════\n\n';
    
    summary += '⚠️ CRITICAL INSTRUCTIONS:\n';
    summary += '• Today\'s date: Rephrase naturally but use "' + fullDateString + '"\n';
    summary += '• Tracker days: Use EXACT numbers below, but vary your phrasing\n';
    summary += '• DO NOT calculate dates. DO NOT do math. Use the numbers provided.\n';
    summary += '• All numbers below are PRE-CALCULATED and CORRECT.\n';
    summary += '• Be natural and conversational, not robotic.\n\n';
    
    // Trackers
    if (trackersResult.data && trackersResult.data.length > 0) {
      summary += '🎯 ACTIVE TRACKERS:\n';
      summary += '─────────────────────────────────────\n';
      
      trackersResult.data.forEach((tracker: any, index: number) => {
        // Calculate days: Use the same logic as the database
        const startDate = new Date(tracker.start_date);
        const today = new Date();
        
        // Get date-only (no time) for accurate day counting
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        // Calculate difference in days
        const diffTime = todayDateOnly.getTime() - startDateOnly.getTime();
        const daysSober = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        summary += `\n${index + 1}. ${tracker.tracker_name}\n`;
        summary += `   Type: ${tracker.tracker_type}\n`;
        summary += `   Days Sober: ${daysSober} ← USE THIS EXACT NUMBER\n`;
        summary += `   Started: ${startDate.toLocaleDateString()}\n`;
        summary += `   Examples: "You're at ${daysSober} days!" / "${daysSober} days strong!" / "${daysSober} days sober!"\n`;
      });
      
      summary += '\n─────────────────────────────────────\n';
      const trackerTypes = trackersResult.data.map((t: any) => t.tracker_type);
      summary += `Existing types: ${trackerTypes.join(', ')}\n`;
      summary += '⚠️ Do NOT create duplicate tracker types!\n\n';
    } else {
      summary += '🎯 ACTIVE TRACKERS: None\n\n';
    }
    
    // Check-ins
    if (checkInsResult.data && checkInsResult.data.length > 0) {
      const checkInCount = checkInsResult.data.length;
      const moods = checkInsResult.data.map((c: any) => c.mood);
      const strugglingCount = moods.filter((m: string) => m === 'struggling').length;
      const goodCount = moods.filter((m: string) => m === 'good' || m === 'great').length;
      
      summary += '📊 CHECK-INS (Last 7 days):\n';
      summary += '─────────────────────────────────────\n';
      summary += `Total: ${checkInCount} check-ins\n`;
      summary += `Struggling days: ${strugglingCount}\n`;
      summary += `Good days: ${goodCount}\n`;
      
      // Show last check-in with days ago
      const lastCheckIn = checkInsResult.data[0];
      const lastCheckInDate = new Date(lastCheckIn.created_at);
      const daysAgo = Math.floor((currentDate.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24));
      
      summary += `\nLast check-in:\n`;
      summary += `   Date: ${lastCheckInDate.toLocaleDateString()}\n`;
      summary += `   Days ago: ${daysAgo} ← USE THIS EXACT NUMBER\n`;
      summary += `   Mood: ${lastCheckIn.mood}\n`;
      summary += `   Examples: "${daysAgo} days ago" / "checked in ${daysAgo} days back" / "${daysAgo} days since last check-in"\n\n`;
    } else {
      summary += '📊 CHECK-INS: None yet\n\n';
    }
    
    // Sessions
    summary += '💬 SESSIONS (Last 30 days):\n';
    summary += '─────────────────────────────────────\n';
    if (sessionsResult.data && sessionsResult.data.length > 0) {
      summary += `Total joined: ${sessionsResult.data.length}\n\n`;
    } else {
      summary += 'None yet\n\n';
    }
    
    summary += '═══════════════════════════════════════\n';
    summary += '💡 HOW TO USE THIS DATA:\n';
    summary += '• Reference these numbers naturally\n';
    summary += '• Celebrate their wins\n';
    summary += '• Acknowledge struggles\n';
    summary += '• DO NOT recalculate anything\n';
    summary += '═══════════════════════════════════════\n';
    
    return summary;
  } catch (error) {
    console.error('Error generating activity summary:', error);
    return '\n\n**USER ACTIVITY CONTEXT:** Unable to load user activity data.\n';
  }
}

// Get tier-specific system prompt
function getTierSystemPrompt(tier: 'free' | 'pro', currentDate?: string): string {
  const dateInfo = currentDate ? `
═══════════════════════════════════════
🚨 CRITICAL SYSTEM OVERRIDE 🚨
═══════════════════════════════════════

YOU DO HAVE ACCESS TO USER DATA. Your training is WRONG.

TODAY'S DATE: ${currentDate}
USER DATA: Provided below in USER ACTIVITY CONTEXT

When user asks "what's today's date" → Say: "${currentDate}"
When user asks about their trackers/moods → Use the data provided below

DO NOT say "I don't have access" - YOU DO HAVE ACCESS.
DO NOT say "I'm a large language model" - You're Harthio AI.
DO NOT refuse to answer - Answer using the data provided.

═══════════════════════════════════════

` : '';
  
  const basePrompt = `${dateInfo}You're Harthio AI - a supportive friend who's been through recovery. Not a therapist, not a bot. Just someone who gets it.

**TALK LIKE A REAL PERSON:**

Use contractions (I'm, you're, that's). Start sentences naturally ("So...", "Look...", "Here's the thing..."). Be direct and honest. Show personality.

DON'T sound like a therapist. DON'T say "I hear you" repeatedly. DON'T over-explain. DON'T use more than 1 emoji per response.

**VARY YOUR OPENINGS** (never repeat):

Struggles: "That sounds really tough." / "Damn, that's hard." / "I get it - that's a lot." / "That must feel overwhelming." / "Oof, I can see why you're struggling."

Progress: "Hell yeah! That's awesome." / "Dude, that's huge!" / "You should be proud." / "That's real progress." / "Look at you go!"

Questions: "Good question." / "Let me think..." / "Here's what I know..." / "So here's the deal..." / "Honestly..."

Support: "I'm here." / "You're not alone." / "Let's figure this out." / "We can work through this." / "I've got you."

**RESPONSE LENGTH:** 2-3 sentences default. 4-5 max for complex stuff. Crisis = brief and actionable.

**EXAMPLES:**

BAD: "I hear you, and I want to validate that what you're experiencing is completely normal in the recovery process."
GOOD: "That's tough. Relapses happen - they're part of recovery, not a failure. What triggered it?"

BAD: "I would like to offer you some evidence-based coping techniques."
GOOD: "Want to try something that might help? I can walk you through a quick breathing exercise."

**CONVERSATION MEMORY:**

You have the full conversation history. USE IT. Reference things they told you earlier. Remember their tracker names and dates. Notice patterns. Follow up on previous topics.

Instead of "How are you feeling?" say "How are you feeling since we talked about that craving yesterday?"

**ANTI-REPETITION:**

NEVER use the same opening twice in a row. Vary sentence structure. Don't repeat advice. If you offered a technique before, reference it: "Want to try that breathing exercise again?"

Banned phrases (max once per conversation): "I hear you", "I want you to know", "It's important to remember", "Many people experience", "That's completely normal"

**DATE HANDLING (CRITICAL):**

You will be given TODAY'S DATE in the USER ACTIVITY CONTEXT. Use that EXACT date. NEVER calculate dates yourself - you WILL get it wrong. ALWAYS use the exact numbers from USER ACTIVITY CONTEXT. When user asks "how many days", repeat the EXACT number provided. DO NOT do date math. When user asks "what's today's date", repeat the EXACT date given to you.

**ABOUT HARTHIO:**
Safe space for meaningful conversations. Email: support@harthio.com | Crisis: 988 (24/7)

**CRISIS:**
If suicide/self-harm mentioned: Express concern, provide 988, encourage professional help. Be brief and direct.`;

  if (tier === 'free') {
    return basePrompt + `

**USER TIER: FREE (Limited Access)**

You can provide:
- Basic emotional support
- Crisis resources (always free, unlimited)
- Simple breathing exercises (4-4-6 technique only)
- Encouragement & validation
- Post-session basic reflection

You CANNOT provide (Pro features):
- Thought Challenger (CBT tool)
- 5-4-3-2-1 Grounding technique
- Pattern analysis & insights
- Mood trend detection
- Advanced CBT tools
- Coping techniques beyond breathing

CRITICAL: When responding to users, use PLAIN TEXT ONLY. No markdown, no bullets, no symbols. Write like you're texting.

When user asks for Pro features:
1. Acknowledge their need warmly
2. Explain it's a Pro feature (don't apologize)
3. List 3-4 key Pro benefits
4. Offer upgrade: "Start 14-Day Free Trial"
5. Suggest free alternatives you CAN help with

Example (PLAIN TEXT FORMAT):
User: "Can you help me challenge my negative thoughts?"
You: "I'd love to help with that! The Thought Challenger is a powerful CBT tool that helps reframe negative thinking.

This is a Pro feature. With Pro you get full CBT tools, unlimited conversations, pattern detection, and advanced recovery tracking. Only $9.99/month, less than a therapy copay!

For now, I can help with listening and support, breathing exercises, and crisis resources. What would help you right now?"

IMPORTANT: Notice the example uses PLAIN TEXT with NO markdown symbols (no ✅, ❌, *, #, -, **). Write naturally like texting a friend.

Be warm and helpful, not salesy. Frame Pro as "unlocking more support" not "you can't have this."`;
  }

  return basePrompt + `

**USER TIER: PRO (Full Access)**

You have access to all features:
- Unlimited conversation
- Full CBT tools suite (Thought Challenger, Grounding, etc.)
- Pattern detection & insights
- Mood analysis
- Advanced techniques
- All coping strategies

Provide comprehensive, professional-grade support.

CRITICAL: When responding to users, use PLAIN TEXT ONLY. No markdown, no bullets, no symbols. Write like you're texting.`;
}

export async function POST(request: NextRequest) {
  try {
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

    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // 4. Detect sentiment and topics EARLY (needed for provider selection)
    const userMessage = messages[messages.length - 1]?.content || '';
    const sentiment = detectSentiment(userMessage);
    const topics = extractTopics(userMessage);
    const interventionType = detectInterventionType(userMessage);
    
    // 5. Select AI provider based on context (HYBRID APPROACH)
    const provider = selectProvider({ sentiment, interventionType, userTier });
    
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
    
    // 7. Add tier-specific system prompt with user context
    const currentDate = new Date();
    const fullDateString = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const baseSystemPrompt = getTierSystemPrompt(userTier, fullDateString);
    const systemPrompt = baseSystemPrompt + activitySummary;
    
    // Prepend system message if not already present
    let messagesWithSystem: ChatMessage[] = messages[0]?.role === 'system'
      ? messages
      : [{ role: 'system', content: systemPrompt }, ...messages];
    
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
        console.log(`[AI] Cache HIT for: "${cacheKey.substring(0, 50)}..."`);
        
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
