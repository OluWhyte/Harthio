# Email Debugging Guide - Join Request Emails Not Sending in Production

## Problem Summary
- **Working**: Signup emails send in production ✅
- **Working**: All emails send in localhost ✅
- **NOT Working**: Join request emails don't send in production ❌
- **Working**: Join requests go through (in-app notification works) ✅

## Root Cause Analysis

The issue is likely one of the following:

### 1. **Environment Variables Missing in Production**
The most common cause - Vercel environment variables not set correctly.

**Check in Vercel Dashboard:**
- Go to: https://vercel.com/your-project/settings/environment-variables
- Verify these are set for **Production**:
  - `RESEND_API_KEY` = `re_S5kk3BgY_BHwXvCgXSqmqbb6PgVgkHgpx`
  - `EMAIL_FROM_ADDRESS` = `Harthio <no-reply@harthio.com>`
  - `NEXT_PUBLIC_APP_URL` = `https://harthio.com`

**Important**: After adding/updating environment variables, you MUST redeploy!

### 2. **Server-Side vs Client-Side Execution**
Join requests might be triggered from client-side code, causing fetch issues.

**The Fix**: The email service already handles this:
```typescript
const baseUrl = typeof window !== 'undefined' 
  ? '' // Client-side: relative URL
  : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'); // Server-side: absolute URL
```

### 3. **Rate Limiting**
The `/api/send-email` endpoint has rate limiting that might be blocking requests.

**Check**: Look for rate limit logs in Vercel logs.

### 4. **Resend API Issues**
- Domain verification not complete
- API key invalid or expired
- Sending limits reached

## Debugging Steps

### Step 1: Check Vercel Logs
1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by "Runtime Logs"
3. Look for these log messages when a join request is sent:
   - `🔔 [JOIN REQUEST] Preparing to send notification`
   - `📧 [JOIN REQUEST] Fetching author email`
   - `📧 [JOIN REQUEST] Sending enhanced notification with email`
   - `📧 [EMAIL SERVICE] sendEmail called`
   - `📧 [SEND-EMAIL API] Request received`
   - `📧 [SEND-EMAIL API] Attempting to send via Resend`
   - `✅ [SEND-EMAIL API] Email sent successfully`

### Step 2: Test Email API Directly
Create a test file to call the API directly:

```bash
# Test in production
curl -X POST https://harthio.com/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-test-email@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test</p>",
    "text": "This is a test"
  }'
```

### Step 3: Check Resend Dashboard
1. Go to: https://resend.com/emails
2. Check if emails are being sent but failing
3. Look for error messages

### Step 4: Verify Domain Configuration
1. Go to: https://resend.com/domains
2. Verify `harthio.com` is verified
3. Check DNS records are correct

## Enhanced Logging Added

I've added comprehensive logging throughout the email flow:

### In `supabase-services.ts` (where join request is created):
- Logs when notification process starts
- Logs author email fetch
- Logs success/failure of notification

### In `notification-service.ts`:
- Logs all parameters passed
- Logs environment variables
- Logs each step of the process

### In `email-service.ts`:
- Logs when sendEmail is called
- Logs API URL being called
- Logs response status and result

### In `send-email/route.ts` (API endpoint):
- Logs when request is received
- Logs Resend configuration status
- Logs email payload
- Logs Resend response

## Quick Fix Checklist

1. ✅ **Verify Environment Variables in Vercel**
   ```
   RESEND_API_KEY=re_S5kk3BgY_BHwXvCgXSqmqbb6PgVgkHgpx
   EMAIL_FROM_ADDRESS=Harthio <no-reply@harthio.com>
   NEXT_PUBLIC_APP_URL=https://harthio.com
   ```

2. ✅ **Redeploy After Setting Variables**
   ```bash
   git commit -m "Add email debugging logs"
   git push
   ```

3. ✅ **Test Join Request in Production**
   - Create a session
   - Send a join request
   - Check Vercel logs immediately

4. ✅ **Check Resend Dashboard**
   - Look for failed emails
   - Check sending limits

## Expected Log Flow (Success)

When a join request is sent, you should see this in Vercel logs:

```
🔔 [JOIN REQUEST] Preparing to send notification to author: xxx
📧 [JOIN REQUEST] Fetching author email...
📧 [JOIN REQUEST] Author data: { hasEmail: true, email: 'xxx***' }
📧 [JOIN REQUEST] Sending enhanced notification with email...
🔔 [JOIN REQUEST EMAIL] Starting notification process: { ... }
📱 [JOIN REQUEST EMAIL] Sending in-app notification...
✅ [JOIN REQUEST EMAIL] In-app notification sent
📧 [JOIN REQUEST EMAIL] Calling email service...
📧 [EMAIL SERVICE] sendEmail called: { ... }
📧 [EMAIL SERVICE] Calling API: https://harthio.com/api/send-email
📧 [SEND-EMAIL API] Request received
📧 [SEND-EMAIL API] Request data: { resendConfigured: true, ... }
📧 [SEND-EMAIL API] Attempting to send via Resend...
📧 [SEND-EMAIL API] Resend payload: { ... }
✅ [SEND-EMAIL API] Email sent successfully via Resend: xxx
📧 [EMAIL SERVICE] API response status: 200
📧 [EMAIL SERVICE] API response result: { success: true, ... }
✅ [JOIN REQUEST EMAIL] Email notification sent successfully
✅ [JOIN REQUEST] Enhanced notification sent successfully
```

## Common Issues & Solutions

### Issue: "Resend not configured"
**Solution**: Set `RESEND_API_KEY` in Vercel environment variables

### Issue: "Email API error (401)"
**Solution**: Resend API key is invalid - check the key in Resend dashboard

### Issue: "Email API error (429)"
**Solution**: Rate limit exceeded - wait or upgrade Resend plan

### Issue: "Invalid email format"
**Solution**: Check that user email is valid in database

### Issue: No logs appear
**Solution**: 
- Check you're looking at the right deployment
- Check the time filter in Vercel logs
- Verify the join request actually went through

## Next Steps

1. **Deploy the changes** with enhanced logging
2. **Test a join request** in production
3. **Check Vercel logs** for the detailed flow
4. **Share the logs** to identify the exact failure point

## Files Modified

- `src/lib/notification-service.ts` - Added detailed logging
- `src/lib/email-service.ts` - Added detailed logging
- `src/app/api/send-email/route.ts` - Added detailed logging
- `src/lib/supabase-services.ts` - Added detailed logging

## Testing Commands

```bash
# Build locally to check for errors
npm run build

# Deploy to production
git add .
git commit -m "Add comprehensive email debugging logs"
git push

# Watch Vercel deployment
vercel logs --follow
```
