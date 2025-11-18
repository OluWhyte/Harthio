// DeepSeek AI Service for Harthio
// Provides conversational AI support for mental health and recovery

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const SYSTEM_PROMPT = `You are Harthio AI, a compassionate mental health and recovery support companion. Your role is to:

1. **Provide emotional support** - Listen without judgment, validate feelings, offer encouragement
2. **Detect crisis situations** - Recognize signs of immediate danger and provide crisis resources
3. **Offer CBT techniques** - Guide users through evidence-based coping strategies
4. **Support recovery** - Help with addiction recovery, sobriety tracking, and relapse prevention
5. **Connect to resources** - Suggest peer sessions, crisis hotlines, and professional help when needed

**Guidelines:**
- Be warm, empathetic, and non-judgmental
- Use simple, clear language
- Keep responses concise (2-3 paragraphs max)
- Never diagnose or prescribe medication
- Always prioritize safety - if someone is in crisis, provide immediate resources
- Encourage professional help for serious issues
- Celebrate wins and progress, no matter how small
- Normalize setbacks as part of recovery

**CBT Tools You Can Offer:**
When users express anxiety, negative thoughts, cravings, or distress, offer these tools:

1. **🧠 Thought Challenger** - Help reframe negative thinking
   - Ask: "What evidence supports this thought?"
   - Ask: "What evidence contradicts it?"
   - Ask: "What would you tell a friend thinking this?"
   - Guide them to a balanced perspective

2. **🌊 Breathing Exercise** - For anxiety/panic
   - Guide: "Let's breathe together"
   - "Breathe in slowly for 4 counts... hold for 4... out for 6"
   - Repeat 3-5 times
   - Check in: "How do you feel now?"

3. **🎯 5-4-3-2-1 Grounding** - For overwhelming feelings
   - Guide them to name:
   - 5 things they can see
   - 4 things they can touch
   - 3 things they can hear
   - 2 things they can smell
   - 1 thing they can taste

4. **💪 Coping Techniques** - Quick relief
   - Cold water on face/wrists
   - Progressive muscle relaxation
   - Safe place visualization
   - Physical movement (walk, stretch)

**Clinical Sequencing (ALWAYS follow this order):**
1. **Validate** - Acknowledge their feelings: "I hear you, that sounds really difficult"
2. **Normalize** - "Many people experience this, you're not alone"
3. **Educate** - Brief explanation: "Anxiety is your body's alarm system"
4. **Offer** - "Would you like to try a technique that might help?"
5. **Guide** - Step-by-step through chosen technique
6. **Check-in** - "How are you feeling now? Better, same, or worse?"
7. **Escalate if needed** - If worse or no improvement after 2 techniques, suggest professional help

**When to Offer Tools:**
- User mentions: anxiety, panic, cravings, negative thoughts, overwhelmed
- Present 2-3 most relevant options
- Let them choose what feels right
- Never force a technique

**After Technique:**
- Always check in: "How are you feeling now?"
- If better: Celebrate and reinforce
- If same: Offer alternative technique
- If worse: "It's okay, not every technique works for everyone. Would you like to talk more, or would connecting with a professional be helpful?"

**Crisis Keywords to Watch For:**
- Suicide, self-harm, overdose, ending life
- Immediate danger to self or others
- Severe mental health crisis

**When Crisis Detected:**
Immediately provide:
- 988 Suicide & Crisis Lifeline
- Crisis Text Line (text HOME to 741741)
- Emergency services (911)
- Encourage them to reach out to someone they trust

**Tone:** Supportive friend who truly cares, not a clinical therapist.`;

export const aiService = {
  /**
   * Send a chat message to DeepSeek AI
   */
  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'Failed to get AI response',
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message,
        usage: data.usage,
      };
    } catch (error: any) {
      console.error('AI chat error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  },

  /**
   * Get the system prompt for Harthio AI
   */
  getSystemPrompt(): string {
    return SYSTEM_PROMPT;
  },

  /**
   * Check if a message contains crisis keywords
   */
  detectCrisis(message: string): boolean {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'overdose',
      'jump off', 'hang myself', 'gun to my head',
      'hurt my child', 'harm my baby', 'self harm',
      'cutting', 'hurt myself', 'voices telling me',
    ];

    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  },

  /**
   * Detect tracker creation intent and extract information
   */
  detectTrackerIntent(message: string): {
    hasIntent: boolean;
    type?: 'alcohol' | 'smoking' | 'drugs' | 'gambling' | 'other';
    confidence: number;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Alcohol keywords
    if (lowerMessage.match(/\b(alcohol|drinking|drink|beer|wine|liquor|sober|sobriety)\b/)) {
      return { hasIntent: true, type: 'alcohol', confidence: 0.9 };
    }
    
    // Smoking keywords
    if (lowerMessage.match(/\b(smok|cigarette|tobacco|vap|nicotine)\b/)) {
      return { hasIntent: true, type: 'smoking', confidence: 0.9 };
    }
    
    // Drugs keywords
    if (lowerMessage.match(/\b(drug|substance|cocaine|heroin|meth|opioid|pill|clean)\b/)) {
      return { hasIntent: true, type: 'drugs', confidence: 0.9 };
    }
    
    // Gambling keywords
    if (lowerMessage.match(/\b(gambl|bet|casino|poker|slot)\b/)) {
      return { hasIntent: true, type: 'gambling', confidence: 0.9 };
    }
    
    return { hasIntent: false, confidence: 0 };
  },

  /**
   * Detect if user needs CBT tools
   */
  detectCBTNeed(message: string): {
    needsHelp: boolean;
    suggestedTools: string[];
    keywords: string[];
  } {
    const lowerMessage = message.toLowerCase();
    const suggestedTools: string[] = [];
    const keywords: string[] = [];

    // Anxiety/Panic keywords
    if (lowerMessage.match(/\b(anxious|anxiety|panic|worried|nervous|scared|afraid|overwhelmed)\b/)) {
      suggestedTools.push('breathing', 'grounding');
      keywords.push('anxiety');
    }

    // Negative thoughts keywords
    if (lowerMessage.match(/\b(worthless|failure|can't do|hopeless|useless|stupid|hate myself)\b/)) {
      suggestedTools.push('thought-challenger');
      keywords.push('negative-thoughts');
    }

    // Cravings keywords
    if (lowerMessage.match(/\b(craving|urge|want to use|tempted|thinking about using)\b/)) {
      suggestedTools.push('coping', 'grounding');
      keywords.push('cravings');
    }

    // Stress keywords
    if (lowerMessage.match(/\b(stressed|stress|pressure|tense|can't cope)\b/)) {
      suggestedTools.push('breathing', 'coping');
      keywords.push('stress');
    }

    return {
      needsHelp: suggestedTools.length > 0,
      suggestedTools: [...new Set(suggestedTools)], // Remove duplicates
      keywords,
    };
  },

  /**
   * Extract start date from message
   */
  extractStartDate(message: string): Date | null {
    const lowerMessage = message.toLowerCase();
    const today = new Date();
    
    // Today
    if (lowerMessage.match(/\b(today|now|just now)\b/)) {
      return today;
    }
    
    // Yesterday
    if (lowerMessage.match(/\byesterday\b/)) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }
    
    // X days ago
    const daysAgoMatch = lowerMessage.match(/(\d+)\s*days?\s*ago/);
    if (daysAgoMatch) {
      const days = parseInt(daysAgoMatch[1]);
      const date = new Date(today);
      date.setDate(date.getDate() - days);
      return date;
    }
    
    // X weeks ago
    const weeksAgoMatch = lowerMessage.match(/(\d+)\s*weeks?\s*ago/);
    if (weeksAgoMatch) {
      const weeks = parseInt(weeksAgoMatch[1]);
      const date = new Date(today);
      date.setDate(date.getDate() - (weeks * 7));
      return date;
    }
    
    // X months ago
    const monthsAgoMatch = lowerMessage.match(/(\d+)\s*months?\s*ago/);
    if (monthsAgoMatch) {
      const months = parseInt(monthsAgoMatch[1]);
      const date = new Date(today);
      date.setMonth(date.getMonth() - months);
      return date;
    }
    
    return null;
  },
};
