# Streaming AI Responses - Integration Guide

## Quick Start

To enable streaming responses in your AI chat UI, follow these steps:

### 1. Update Your Chat Component

```typescript
import { aiService } from '@/ai';
import { useState } from 'react';

function AIChatComponent() {
  const [messages, setMessages] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (userMessage: string) => {
    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    
    // Start streaming
    setIsStreaming(true);
    setCurrentResponse('');
    
    await aiService.chatStream(
      newMessages,
      // On each chunk
      (chunk) => {
        setCurrentResponse(prev => prev + chunk);
      },
      // On complete
      (fullText) => {
        setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
        setCurrentResponse('');
        setIsStreaming(false);
      },
      // On error
      (error) => {
        console.error('Streaming error:', error);
        setIsStreaming(false);
        // Fallback to non-streaming
        aiService.chat(newMessages).then(response => {
          if (response.success) {
            setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
          }
        });
      }
    );
  };

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.content}</div>
      ))}
      
      {isStreaming && currentResponse && (
        <div className="streaming-message">
          {currentResponse}
          <span className="cursor">▊</span>
        </div>
      )}
      
      <input onSubmit={(e) => sendMessage(e.target.value)} />
    </div>
  );
}
```

### 2. Add Typing Indicator CSS

```css
.streaming-message {
  animation: fadeIn 0.3s ease-in;
}

.cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### 3. Fallback Strategy

The streaming implementation includes automatic fallback to non-streaming if:
- Streaming fails
- Browser doesn't support streaming
- Network issues occur

This ensures users always get a response.

## Testing

1. **Test streaming works:**
   - Send a message
   - Verify tokens appear one by one
   - Check cursor animation

2. **Test fallback:**
   - Disable streaming endpoint
   - Verify non-streaming still works

3. **Test error handling:**
   - Simulate network error
   - Verify graceful degradation

## Performance Tips

1. **Debounce rendering** if streaming is too fast:
```typescript
const [displayText, setDisplayText] = useState('');
const bufferRef = useRef('');

const onChunk = (chunk: string) => {
  bufferRef.current += chunk;
  // Update display every 50ms
  setTimeout(() => {
    setDisplayText(bufferRef.current);
  }, 50);
};
```

2. **Smooth scrolling** as text appears:
```typescript
useEffect(() => {
  if (chatContainerRef.current) {
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }
}, [currentResponse]);
```

## Next Steps

After streaming is working:
1. Add user ratings for AI responses
2. Track streaming vs non-streaming usage
3. Monitor user satisfaction metrics
