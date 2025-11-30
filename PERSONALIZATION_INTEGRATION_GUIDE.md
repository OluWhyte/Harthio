# AI Personalization - Integration Guide

## Quick Start

The personalization system works automatically, but you can enhance it by tracking user feedback and preferences.

## 1. Add User Feedback Buttons

Add thumbs up/down buttons after each AI response:

```typescript
import { AIPersonalizationService } from '@/ai';

function AIMessage({ message, userId }) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const handleFeedback = async (isPositive: boolean) => {
    setFeedback(isPositive ? 'positive' : 'negative');
    
    // Learn from feedback
    await AIPersonalizationService.learnFromFeedback(
      userId,
      message.content,
      isPositive
    );
    
    // Show toast
    toast({
      title: isPositive ? 'Thanks!' : 'Got it',
      description: isPositive 
        ? 'I\'ll remember what works for you'
        : 'I\'ll try a different approach next time'
    });
  };

  return (
    <div className="ai-message">
      <p>{message.content}</p>
      
      {!feedback && (
        <div className="feedback-buttons">
          <button onClick={() => handleFeedback(true)}>
            👍 Helpful
          </button>
          <button onClick={() => handleFeedback(false)}>
            👎 Not helpful
          </button>
        </div>
      )}
      
      {feedback && (
        <span className="text-sm text-muted">
          {feedback === 'positive' ? '✓ Marked helpful' : '✓ Feedback received'}
        </span>
      )}
    </div>
  );
}
```

## 2. Track Effective Techniques

When user says a technique helped:

```typescript
// After breathing exercise
if (userMessage.includes('helped') || userMessage.includes('better')) {
  await AIPersonalizationService.recordEffectiveTechnique(userId, 'breathing');
}

// After grounding exercise
if (userMessage.includes('calmer') || userMessage.includes('grounded')) {
  await AIPersonalizationService.recordEffectiveTechnique(userId, 'grounding');
}
```

## 3. Detect Trigger Topics

When user shows distress about specific topics:

```typescript
const detectTriggers = async (message: string, userId: string) => {
  const lower = message.toLowerCase();
  
  if (lower.includes('family') && (lower.includes('upset') || lower.includes('angry'))) {
    await AIPersonalizationService.recordTriggerTopic(userId, 'family');
  }
  
  if (lower.includes('work') && (lower.includes('stress') || lower.includes('overwhelm'))) {
    await AIPersonalizationService.recordTriggerTopic(userId, 'work');
  }
};
```

## 4. User Preference Settings (Optional)

Let users customize their AI experience:

```typescript
function AIPreferencesSettings({ userId }) {
  const [prefs, setPrefs] = useState(null);
  
  useEffect(() => {
    AIPersonalizationService.getUserPreferences(userId).then(setPrefs);
  }, [userId]);
  
  const updateTone = async (tone: string) => {
    await AIPersonalizationService.updatePreferences(userId, {
      preferred_tone: tone
    });
    toast({ title: 'Preferences updated' });
  };
  
  return (
    <div className="preferences">
      <h3>AI Communication Style</h3>
      
      <label>Tone:</label>
      <select value={prefs?.preferred_tone} onChange={(e) => updateTone(e.target.value)}>
        <option value="casual">Casual & Friendly</option>
        <option value="supportive">Warm & Supportive</option>
        <option value="direct">Direct & Practical</option>
        <option value="empathetic">Gentle & Empathetic</option>
      </select>
      
      <label>Response Length:</label>
      <select value={prefs?.preferred_response_length}>
        <option value="brief">Brief (1-2 sentences)</option>
        <option value="medium">Medium (2-3 sentences)</option>
        <option value="detailed">Detailed (3-5 sentences)</option>
      </select>
      
      <label>Conversation Style:</label>
      <div>
        <input 
          type="radio" 
          checked={prefs?.prefers_questions}
          onChange={() => updatePreferences({ prefers_questions: true })}
        />
        <label>Ask questions to explore</label>
      </div>
      <div>
        <input 
          type="radio" 
          checked={prefs?.prefers_direct_advice}
          onChange={() => updatePreferences({ prefers_direct_advice: true })}
        />
        <label>Give direct advice</label>
      </div>
    </div>
  );
}
```

## 5. View Personalization Insights (Admin)

Show what the AI has learned about each user:

```typescript
function UserPersonalizationInsights({ userId }) {
  const [prefs, setPrefs] = useState(null);
  
  useEffect(() => {
    AIPersonalizationService.getUserPreferences(userId).then(setPrefs);
  }, [userId]);
  
  if (!prefs) return <div>Loading...</div>;
  
  return (
    <div className="insights">
      <h3>AI Personalization Insights</h3>
      
      <div>
        <strong>Preferred Tone:</strong> {prefs.preferred_tone}
      </div>
      
      <div>
        <strong>Effective Techniques:</strong>
        {prefs.effective_techniques.length > 0 
          ? prefs.effective_techniques.join(', ')
          : 'Still learning...'}
      </div>
      
      <div>
        <strong>Trigger Topics:</strong>
        {prefs.trigger_topics.length > 0 
          ? prefs.trigger_topics.join(', ')
          : 'None identified'}
      </div>
      
      <div>
        <strong>Conversation Style:</strong>
        {prefs.prefers_direct_advice 
          ? 'Prefers direct advice'
          : 'Prefers exploratory questions'}
      </div>
    </div>
  );
}
```

## Testing

1. **Test automatic learning:**
   - Give positive feedback on a message
   - Check database: `SELECT * FROM ai_user_preferences WHERE user_id = 'xxx'`
   - Verify `positive_response_patterns` updated

2. **Test personalization:**
   - Set preferred tone to "casual"
   - Send message to AI
   - Verify response matches casual tone

3. **Test memory optimization:**
   - Have a 20+ message conversation
   - Check that older messages are summarized
   - Verify recent context is preserved

## Next Steps

After personalization is working:
1. Add analytics to track effectiveness
2. Build admin dashboard to view insights
3. A/B test different personalization strategies
