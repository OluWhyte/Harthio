# Jitsi Meet Integration Guide

## Overview

Your Harthio application now supports **hybrid video calling** with Jitsi Meet as the primary provider and WebRTC + Coturn as a fallback. This provides better reliability and user experience.

## How It Works

1. **Primary**: Jitsi Meet provides the main video calling experience
2. **Fallback**: If Jitsi fails, the system automatically falls back to your existing WebRTC + Coturn setup
3. **Seamless**: Users don't need to do anything - the system handles the switching automatically

## Configuration Required

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Jitsi Meet Configuration (Primary)
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
NEXT_PUBLIC_JITSI_JWT_APP_ID=your-jitsi-app-id
NEXT_PUBLIC_JITSI_JWT_SECRET=your-jitsi-jwt-secret

# WebRTC + Coturn Configuration (Fallback)
NEXT_PUBLIC_COTURN_SERVER=your-coturn-server-ip
NEXT_PUBLIC_COTURN_SECRET=your-coturn-secret
NEXT_PUBLIC_COTURN_REALM=harthio.com
```

### 2. Jitsi Meet Options

You have several options for Jitsi Meet:

#### Option A: Use Public Jitsi Meet (Easiest)
```bash
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
# Leave JWT variables empty for public instance
```

#### Option B: Use Jitsi Meet with JWT Authentication
```bash
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
NEXT_PUBLIC_JITSI_JWT_APP_ID=your-app-id
NEXT_PUBLIC_JITSI_JWT_SECRET=your-jwt-secret
```

#### Option C: Self-Hosted Jitsi Meet
```bash
NEXT_PUBLIC_JITSI_DOMAIN=your-jitsi-domain.com
NEXT_PUBLIC_JITSI_JWT_APP_ID=your-app-id
NEXT_PUBLIC_JITSI_JWT_SECRET=your-jwt-secret
```

## What You Need to Provide

### For Jitsi Meet Integration:

1. **Jitsi Domain**: 
   - Use `meet.jit.si` for public Jitsi
   - Or provide your self-hosted domain

2. **JWT Configuration** (Optional but recommended):
   - App ID for your Jitsi application
   - JWT secret for authentication
   - This provides better security and branding control

### For Coturn Fallback:

1. **Coturn Server**: Your existing Coturn server IP/domain
2. **Coturn Secret**: Your existing Coturn secret key
3. **Realm**: Your domain (defaults to harthio.com)

## Features Added

### 1. Hybrid Video Service
- Automatically tries Jitsi Meet first
- Falls back to WebRTC if Jitsi fails
- Seamless switching without user intervention

### 2. Provider Indicator
- Shows which video provider is being used (Jitsi/WebRTC)
- Blue dot = Jitsi Meet
- Orange dot = WebRTC fallback

### 3. Enhanced Error Handling
- Better error messages
- Automatic retry mechanisms
- Graceful fallback between providers

### 4. Improved UI
- Jitsi Meet interface when using Jitsi
- Existing video interface when using WebRTC
- Status indicators for connection quality

## Testing the Integration

### 1. Quick Test (Public Jitsi)
```bash
# Add to .env.local
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si

# Start your app
npm run dev
```

### 2. Test Fallback
- Temporarily set an invalid Jitsi domain
- Verify it falls back to WebRTC
- Check that both providers work

### 3. Production Testing
- Test with your actual Jitsi configuration
- Verify JWT authentication works
- Test on mobile devices

## Deployment Steps

1. **Update Environment Variables**
   ```bash
   # Update your .env.local with Jitsi configuration
   cp env.template .env.local
   # Edit .env.local with your values
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Test Locally**
   ```bash
   npm run dev
   ```

4. **Deploy to Production**
   - Update your production environment variables
   - Deploy as usual

## Troubleshooting

### Jitsi Not Loading
- Check `NEXT_PUBLIC_JITSI_DOMAIN` is correct
- Verify domain is accessible
- Check browser console for errors

### JWT Authentication Issues
- Verify `NEXT_PUBLIC_JITSI_JWT_APP_ID` and `NEXT_PUBLIC_JITSI_JWT_SECRET`
- Check JWT token generation in browser dev tools
- Ensure your Jitsi server supports JWT

### Fallback Not Working
- Verify Coturn configuration is correct
- Check WebRTC functionality independently
- Review browser console for WebRTC errors

## Benefits of This Integration

1. **Better Reliability**: Two video providers instead of one
2. **Improved Performance**: Jitsi Meet is optimized for video calls
3. **Better Mobile Support**: Jitsi handles mobile devices well
4. **Reduced Server Load**: Jitsi handles the heavy lifting
5. **Professional UI**: Jitsi provides a polished video interface
6. **Automatic Fallback**: No manual intervention needed

## Next Steps

1. **Set up your Jitsi configuration** (domain and optionally JWT)
2. **Test the integration** with a few users
3. **Monitor performance** and adjust as needed
4. **Consider self-hosting Jitsi** for full control (optional)

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all environment variables are set correctly
3. Test both Jitsi and WebRTC independently
4. Check network connectivity and firewall settings

The integration maintains backward compatibility - your existing WebRTC setup continues to work as a fallback, ensuring no disruption to your users.