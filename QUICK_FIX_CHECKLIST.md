# Quick Fix Checklist - Join Request Emails Not Sending

## ⚡ Immediate Actions

### 1. Check Vercel Environment Variables (Most Likely Fix)
```
Go to: https://vercel.com/[your-project]/settings/environment-variables

Verify these are set for PRODUCTION:
☐ RESEND_API_KEY = re_S5kk3BgY_BHwXvCgXSqmqbb6PgVgkHgpx
☐ EMAIL_FROM_ADDRESS = Harthio <no-reply@harthio.com>
☐ NEXT_PUBLIC_APP_URL = https://harthio.com

⚠️ IMPORTANT: After adding/updating, you MUST redeploy!
```

### 2. Deploy the Logging Changes
```bash
git add .
git commit -m "Add email debugging logs"
git push
```

### 3. Test & Check Logs
```
1. Wait for deployment to complete
2. Send a join request in production
3. Go to: https://vercel.com/[your-project]/logs
4. Look for these markers:
   - 🔔 [JOIN REQUEST]
   - 📧 [EMAIL SERVICE]
   - 📧 [SEND-EMAIL API]
   - ✅ or ❌ messages
```

## 🔍 What to Look For in Logs

### Success Pattern:
```
🔔 [JOIN REQUEST] Preparing to send notification
📧 [JOIN REQUEST] Fetching author email...
📧 [JOIN REQUEST] Sending enhanced notification with email...
📧 [EMAIL SERVICE] sendEmail called
📧 [SEND-EMAIL API] Request received
✅ [SEND-EMAIL API] Email sent successfully via Resend
```

### Common Failure Patterns:

**Pattern 1: Missing API Key**
```
📧 [SEND-EMAIL API] Request data: { resendConfigured: false }
⚠️ [SEND-EMAIL API] Resend not configured - using fallback
```
**Fix**: Set `RESEND_API_KEY` in Vercel

**Pattern 2: Invalid API Key**
```
❌ [SEND-EMAIL API] Resend email error: { status: 401 }
```
**Fix**: Check API key is correct in Vercel

**Pattern 3: No Author Email**
```
📧 [JOIN REQUEST] Author data: { hasEmail: false }
⚠️ [JOIN REQUEST] No email found, sending in-app notification only
```
**Fix**: Check user has email in database

**Pattern 4: Rate Limited**
```
⚠️ [SEND-EMAIL API] Rate limit exceeded
```
**Fix**: Wait or upgrade Resend plan

## 🧪 Quick Tests

### Test 1: Direct API Test
```bash
curl -X POST https://harthio.com/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com","subject":"Test","html":"<p>Test</p>","text":"Test"}'
```
**Expected**: `{"success":true,"messageId":"..."}`

### Test 2: Check Resend Dashboard
```
Go to: https://resend.com/emails
Look for: Recent email attempts
Check: Any error messages
```

### Test 3: Verify Domain
```
Go to: https://resend.com/domains
Check: harthio.com is verified
Status: All DNS records green
```

## 📋 Troubleshooting Decision Tree

```
Email not sending?
│
├─ Check Vercel logs
│  │
│  ├─ No logs at all?
│  │  └─ Check deployment time & filter
│  │
│  ├─ "Resend not configured"?
│  │  └─ Set RESEND_API_KEY in Vercel → Redeploy
│  │
│  ├─ "Email API error (401)"?
│  │  └─ Invalid API key → Check Resend dashboard
│  │
│  ├─ "Email API error (429)"?
│  │  └─ Rate limited → Wait or upgrade plan
│  │
│  ├─ "No email found"?
│  │  └─ User has no email → Check database
│  │
│  └─ "Email sent successfully"?
│     └─ Check spam folder & Resend dashboard
│
└─ Still not working?
   └─ Share logs in EMAIL_DEBUG_GUIDE.md format
```

## ✅ Verification Steps

After deploying the fix:

1. ☐ Environment variables set in Vercel
2. ☐ Redeployed after setting variables
3. ☐ Tested join request in production
4. ☐ Checked Vercel logs for success markers
5. ☐ Checked Resend dashboard for sent email
6. ☐ Checked recipient inbox (and spam folder)

## 📞 If Still Not Working

Share these details:
1. Screenshot of Vercel environment variables (hide sensitive values)
2. Vercel logs from the time of join request
3. Resend dashboard screenshot
4. Any error messages you see

## 🎯 Most Common Solution

**90% of the time, the issue is:**
```
RESEND_API_KEY not set in Vercel Production environment
```

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Add RESEND_API_KEY for Production
3. Redeploy
4. Test again
