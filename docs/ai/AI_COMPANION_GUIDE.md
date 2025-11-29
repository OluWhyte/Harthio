# AI Companion Guide

**Last Updated**: November 29, 2025  
**Status**: Active  

---

## Overview

The AI Companion is a 24/7 support system that provides evidence-based mental health support, crisis detection, and proactive interventions.

## Features

### 1. AI Chat Service
- **Location**: `src/ai/ai-service.ts`
- **Provider**: OpenAI GPT-4
- **Capabilities**:
  - Evidence-based CBT tools
  - Crisis detection and intervention
  - Tracker intent recognition
  - Conversation history

### 2. Crisis Detection
- Real-time monitoring of user messages
- Automatic detection of crisis keywords
- Immediate intervention with resources
- Escalation to human support when needed

### 3. Proactive AI
- **Location**: `src/ai/services/proactive-ai-service.ts`
- Mood change detection
- Check-in reminders
- Milestone celebrations
- Personalized interventions

### 4. Tracker Integration
- Automatic tracker creation from chat
- Progress monitoring
- Milestone notifications
- Analytics integration

## Configuration

### API Setup
```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4-turbo-preview
```

### Rate Limiting
- Free tier: 10 messages/day
- Pro tier: Unlimited messages
- Configurable in `src/ai/services/ai-rate-limit-service.ts`

## Usage

### Basic Chat
```typescript
import { aiService } from '@/ai';

const response = await aiService.chat(userId, message);
```

### Crisis Detection
```typescript
const { isCrisis, resources } = await aiService.detectCrisis(message);
```

### Proactive Interventions
```typescript
import { detectMoodChange } from '@/ai/services/proactive-ai-service';

const intervention = await detectMoodChange(userId, recentMessages);
```

## Database Schema

### ai_chat_history
```sql
CREATE TABLE ai_chat_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  is_crisis BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ai_feedback
```sql
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY,
  chat_id UUID REFERENCES ai_chat_history(id),
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Best Practices

1. **Always check rate limits** before sending messages
2. **Handle crisis situations** with appropriate resources
3. **Store conversation history** for context
4. **Monitor feedback** to improve responses
5. **Test thoroughly** before deploying changes

## Troubleshooting

### Common Issues

**Issue**: Rate limit exceeded
**Solution**: Check user tier and upgrade if needed

**Issue**: Slow responses
**Solution**: Use streaming responses for better UX

**Issue**: Crisis not detected
**Solution**: Review crisis keywords in `ai-service.ts`

## Future Enhancements

- Multi-language support
- Voice input/output
- Advanced analytics
- Custom AI models
- Integration with therapist network

---

For analytics and monitoring, see [AI Analytics Guide](./AI_ANALYTICS_GUIDE.md)
