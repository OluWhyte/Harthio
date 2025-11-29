# AI Module

Centralized AI functionality for Harthio. This module contains all AI-related services, utilities, and logic.

## Structure

```
src/ai/
├── index.ts                    # Main export file
├── ai-service.ts              # Core AI chat service
├── dev.ts                     # Development utilities
└── services/
    ├── ai-chat-history-service.ts    # Chat history management
    ├── ai-feedback-service.ts        # User feedback on AI responses
    ├── ai-rate-limit-service.ts      # Rate limiting for AI usage
    └── proactive-ai-service.ts       # Proactive AI prompts & interventions
```

## Core Services

### ai-service.ts
Main AI chat service that handles:
- Chat message processing
- Crisis detection
- Tracker intent detection
- CBT tool recommendations
- Date extraction for tracker creation
- Hybrid provider selection (Groq/DeepSeek)

### Services

#### ai-chat-history-service.ts
Manages conversation history:
- Save/load chat messages
- Conversation persistence
- History retrieval

#### ai-feedback-service.ts
Handles user feedback on AI responses:
- Thumbs up/down ratings
- Feedback collection
- Response quality tracking

#### ai-rate-limit-service.ts
Rate limiting for AI usage:
- Free tier: Limited messages per day
- Pro tier: Unlimited messages
- Usage tracking and enforcement

#### proactive-ai-service.ts
Proactive AI interventions:
- Session browsing detection
- Mood change detection
- Idle detection
- Multiple resets detection
- Post-session support
- Progress page insights

## Usage

Import from the main module:

```typescript
import { aiService, detectSessionBrowsing } from '@/ai';
```

Or import specific services:

```typescript
import { aiService } from '@/ai/ai-service';
import { detectMoodChange } from '@/ai/services/proactive-ai-service';
```

## API Integration

The AI services are used by:
- `/api/ai/chat` - Main chat endpoint
- Proactive AI monitor component
- Various page components for context-aware prompts

## Configuration

AI providers are configured via environment variables:
- `GROQ_API_KEY` - Groq API key (fast, for critical moments)
- `DEEPSEEK_API_KEY` - DeepSeek API key (cost-effective, for routine)

## Future Expansion

This module is designed to be self-contained and easy to expand:
- Add new AI providers
- Implement new intervention types
- Add specialized AI tools
- Integrate additional AI features
