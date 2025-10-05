# Vercel Deployment Guide for Harthio

## Pre-Deployment Checklist

### ✅ Environment Variables Required
Make sure these are set in Vercel dashboard:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_CONTACT_EMAIL=your_contact_email

# Optional: Analytics/Monitoring
NEXT_PUBLIC_VERCEL_URL=auto-populated-by-vercel
```

### ✅ Database Setup
Ensure your Supabase database has:
1. All tables created (users, topics, messages, ratings)
2. RLS policies enabled
3. Real-time enabled for messages table
4. Auth configured

### ✅ Domain Configuration
- **Production Domain**: harthio.com
- **HTTPS**: Automatically handled by Vercel
- **Mobile Support**: HTTPS enables camera/microphone access

## Deployment Steps

### 1. Connect to Vercel
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel
```

### 2. Configure Environment Variables
In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all required environment variables
3. Make sure they're available for Production, Preview, and Development

### 3. Configure Domains
1. Add custom domain: harthio.com
2. Configure DNS records as instructed by Vercel
3. SSL certificates are automatically provisioned

### 4. Verify Deployment
After deployment, test:
- ✅ User authentication works
- ✅ Session creation/joining works
- ✅ Video calling works (HTTPS enables camera/mic)
- ✅ In-call messaging works
- ✅ Mobile access works properly

## Mobile Testing on Production

### HTTPS Benefits
- ✅ Camera/microphone access works on mobile
- ✅ No need for ngrok tunnels in production
- ✅ Secure WebRTC connections
- ✅ PWA capabilities enabled

### Testing Steps
1. Deploy to Vercel
2. Access https://harthio.com on mobile
3. Test video calling functionality
4. Verify in-call messaging works

## Troubleshooting

### Common Issues

**Build Errors:**
- Check TypeScript errors: `npm run typecheck`
- Check linting: `npm run lint`
- Verify all dependencies are in package.json

**Runtime Errors:**
- Check environment variables are set correctly
- Verify Supabase connection
- Check browser console for errors

**Mobile Issues:**
- Ensure HTTPS is working
- Check camera/microphone permissions
- Verify WebRTC compatibility

### Performance Optimization
- Images are optimized automatically by Vercel
- Static assets are served from CDN
- API routes are serverless functions

## Monitoring

### Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Monitor Core Web Vitals
- Track user engagement

### Error Tracking
- Consider adding Sentry for error tracking
- Monitor WebRTC connection failures
- Track mobile-specific issues

## Security Considerations

### Production Security
- ✅ HTTPS enforced automatically
- ✅ Environment variables secured
- ✅ Database RLS policies active
- ✅ Session access control implemented

### CORS Configuration
Next.js handles CORS automatically, but verify:
- API routes work correctly
- WebRTC signaling works
- Real-time subscriptions work

## Post-Deployment

### 1. Test All Features
- [ ] User registration/login
- [ ] Session creation
- [ ] Session joining (request system)
- [ ] Video calling (desktop & mobile)
- [ ] In-call messaging
- [ ] Session ratings

### 2. Mobile Testing
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Camera/microphone permissions
- [ ] Video quality on mobile networks

### 3. Performance Testing
- [ ] Page load speeds
- [ ] Video call connection times
- [ ] Message delivery latency
- [ ] Mobile performance

## Rollback Plan
If issues occur:
1. Revert to previous deployment in Vercel dashboard
2. Check logs for specific errors
3. Fix issues locally and redeploy
4. Monitor error rates and user feedback

## Success Metrics
- ✅ Mobile video calls work without issues
- ✅ In-call messaging functions properly
- ✅ Session security is maintained
- ✅ User experience is smooth across devices