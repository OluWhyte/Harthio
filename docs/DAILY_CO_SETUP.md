# Daily.co Integration Setup Guide

## Overview

This guide walks you through setting up Daily.co as the primary video calling service for Harthio, with P2P WebRTC as a fallback.

## Prerequisites

1. **Daily.co Account**: Sign up at [daily.co](https://daily.co)
2. **API Keys**: Get your API key from the Daily.co dashboard
3. **Domain Setup**: Configure your custom domain (optional)

## Step 1: Daily.co Account Setup

### 1.1 Create Account
1. Go to [daily.co](https://daily.co) and sign up
2. Verify your email address
3. Complete the onboarding process

### 1.2 Get API Keys
1. Navigate to the [Daily.co Dashboard](https://dashboard.daily.co)
2. Go to **Developers** → **API Keys**
3. Copy your API key (keep this secure!)

### 1.3 Configure Domain (Optional)
1. In the dashboard, go to **Domains**
2. Add your custom domain: `harthio.daily.co`
3. Follow DNS setup instructions
4. Wait for verification (can take up to 24 hours)

## Step 2: Environment Configuration

### 2.1 Update Environment Variables

Add these to your `.env.local` file:

```env
# Daily.co Configuration
NEXT_PUBLIC_DAILY_DOMAIN=harthio.daily.co
DAILY_API_KEY=your_daily_api_key_here
DAILY_API_SECRET=your_daily_api_secret_here

# P2P WebRTC Fallback
NEXT_PUBLIC_WEBRTC_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
NEXT_PUBLIC_WEBRTC_TURN_SERVERS=turn:your-turn-server.com:3478
```

### 2.2 Production Environment

For production, set these in your Vercel dashboard:

```env
NEXT_PUBLIC_DAILY_DOMAIN=harthio.daily.co
DAILY_API_KEY=your_production_daily_api_key
DAILY_API_SECRET=your_production_daily_api_secret
```

## Step 3: Install Dependencies

```bash
npm install @daily-co/daily-js@latest
```

## Step 4: Test the Integration

### 4.1 Development Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Create a test session
3. Join the session - you should see the Daily.co interface
4. Test audio/video controls
5. Test the fallback by clicking "Switch to P2P"

### 4.2 Production Testing

1. Deploy to your staging environment
2. Test with multiple devices (desktop, mobile)
3. Test network conditions (good, poor, offline)
4. Verify fallback mechanism works

## Step 5: Daily.co Dashboard Configuration

### 5.1 Room Settings
Configure default room settings in the Daily.co dashboard:

- **Max Participants**: 2 (for 1-on-1 conversations)
- **Enable Chat**: Yes
- **Enable Screen Share**: Yes
- **Enable Recording**: No (can be enabled later)
- **Auto-delete**: 24 hours after creation

### 5.2 Branding (Optional)
- Upload your Harthio logo
- Set brand colors to match your theme
- Customize the waiting room

## Step 6: Mobile Optimization

### 6.1 iOS Configuration
Daily.co works well on iOS Safari and Chrome. No additional setup needed.

### 6.2 Android Configuration
Daily.co supports Android Chrome and Firefox. Test thoroughly on various Android devices.

### 6.3 PWA Support
If you have a PWA, Daily.co integrates seamlessly with installed web apps.

## Step 7: Monitoring and Analytics

### 7.1 Daily.co Analytics
- Access call quality metrics in the Daily.co dashboard
- Monitor connection success rates
- Track usage patterns

### 7.2 Custom Analytics
The integration includes custom event tracking:
- Connection attempts
- Fallback usage
- Call duration
- Quality metrics

## Troubleshooting

### Common Issues

#### 1. "Failed to load Daily SDK"
- Check your internet connection
- Verify the Daily.co CDN is accessible
- Check browser console for CORS errors

#### 2. "Room creation failed"
- Verify your API key is correct
- Check API key permissions in Daily.co dashboard
- Ensure you haven't exceeded rate limits

#### 3. "Camera/microphone access denied"
- Guide users to enable permissions
- Provide fallback instructions
- Test on different browsers

#### 4. Poor video quality
- Daily.co automatically adjusts quality
- Check network conditions
- Consider enabling low-data mode for mobile

### Debug Mode

Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG_DAILY=true
```

This will log detailed connection information to the browser console.

## Security Considerations

### 1. API Key Security
- Never expose API keys in client-side code
- Use server-side API routes for room management
- Rotate keys regularly

### 2. Room Access Control
- Rooms are created with unique names per session
- Rooms auto-delete after 24 hours
- Consider adding additional access controls if needed

### 3. Privacy
- Daily.co is GDPR compliant
- No recordings are stored by default
- Review Daily.co's privacy policy

## Performance Optimization

### 1. Preloading
The Daily.co SDK is loaded on-demand to reduce initial bundle size.

### 2. Mobile Battery
Daily.co includes battery optimization features:
- Automatic quality adjustment
- Background processing optimization
- Efficient codec usage

### 3. Bandwidth Management
- Automatic quality scaling based on connection
- Low-data mode for poor connections
- Efficient P2P fallback

## Support

### Daily.co Support
- Documentation: [docs.daily.co](https://docs.daily.co)
- Support: [help.daily.co](https://help.daily.co)
- Community: [Daily.co Discord](https://discord.gg/daily)

### Harthio Integration Support
- Check the implementation in `src/lib/daily-service.ts`
- Review session page logic in `src/app/session/[sessionId]/page.tsx`
- Test with the debug mode enabled

## Migration from Jitsi

The migration maintains the same interface, so existing UI components work without changes:

1. **Same Methods**: `toggleAudio()`, `toggleVideo()`, `sendMessage()`
2. **Same Events**: `onJoined`, `onLeft`, `onError`, `onMessage`
3. **Enhanced Features**: Better mobile support, quality metrics, screen sharing

## Cost Considerations

### Daily.co Pricing
- **Free Tier**: 10,000 participant minutes/month
- **Starter**: $0.0015 per participant minute
- **Scale**: Custom pricing for high volume

### Estimated Costs
For 1000 sessions/month (30 min average):
- Free tier covers ~333 sessions
- Paid tier: ~$45/month for remaining sessions

This is significantly more cost-effective than building and maintaining your own infrastructure.

---

**Next Steps**: After setup, test thoroughly and monitor the Daily.co dashboard for usage patterns and optimization opportunities.