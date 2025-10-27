# Daily.co Integration Guide

## Overview

Daily.co has been integrated as the primary video calling provider for Harthio, with your API key properly configured for production-grade video sessions.

## Configuration

### Environment Variables

```bash
# Daily.co API Key (already configured)
DAILY_API_KEY=2c96cc2ea678cf8c5e1e36bd53909b4677f67576ee3c036e63466986fbc3a001
```

### Provider Priority

The video service manager now prioritizes providers as follows:

1. **Daily.co** (Primary) - With API key for private rooms
2. **Jitsi Public** (Fallback) - Free public Jitsi servers
3. **Jitsi Self-hosted** (Backup) - Your custom Jitsi server
4. **WebRTC** (Last resort) - Direct peer-to-peer

## Features

### Room Management
- **Private Rooms**: Creates private Daily.co rooms using your API key
- **Auto-cleanup**: Rooms are automatically deleted after sessions end
- **Fallback**: Falls back to public rooms if API fails
- **Expiry**: Rooms expire after 24 hours for security

### Mobile Optimizations
- **Bandwidth Management**: Capped at 1.5 Mbps for mobile data
- **Video Quality**: Adaptive resolution (360p-720p)
- **Audio Quality**: Optimized for mobile networks (16kHz)
- **UI Theme**: Custom Harthio branding

### Advanced Features
- **Screen Sharing**: Built-in screen share support
- **Recording**: Cloud recording capabilities
- **Chat**: Real-time messaging
- **Network Stats**: Connection quality monitoring

## Usage

### Basic Integration
```typescript
import { VideoServiceManager } from '@/lib/video-service-manager';

const manager = new VideoServiceManager(config, callbacks);
await manager.initialize('video-container');
```

### Testing Integration
```typescript
import { testDailyIntegration } from '@/lib/daily-test';

// Test in browser console
await testDailyIntegration();
```

### Room Utilities
```typescript
import { DailyService } from '@/lib/daily-service';

// Create temporary room
const roomUrl = await DailyService.createTemporaryRoom('session-123');

// List existing rooms
const rooms = await DailyService.listRooms(apiKey);
```

## API Key Benefits

With your API key configured, you get:

- **Private Rooms**: Secure, private video sessions
- **Custom Branding**: Harthio-themed interface
- **Advanced Features**: Recording, analytics, webhooks
- **Higher Limits**: More participants and longer sessions
- **Priority Support**: Better reliability and support

## Monitoring

### Room Creation
- Rooms are created with format: `harthio-{sessionId}`
- 24-hour expiry for security
- Automatic cleanup on session end

### Fallback Behavior
- If API key fails → Falls back to public Daily.co rooms
- If Daily.co fails → Falls back to Jitsi
- If all fail → WebRTC direct connection

## Security

- API key is server-side only (not exposed to client)
- Rooms are private by default
- Automatic expiry prevents abandoned rooms
- Clean deletion after sessions

## Next Steps

1. **Test Integration**: Run `testDailyIntegration()` in browser console
2. **Monitor Usage**: Check Daily.co dashboard for room creation
3. **Customize Settings**: Adjust room properties in `daily-service.ts`
4. **Add Webhooks**: Configure Daily.co webhooks for analytics

The integration is now complete and Daily.co is your primary video provider with full API access.