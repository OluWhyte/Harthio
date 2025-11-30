# Automated Email System - Deployment Guide

## Quick Setup (5 minutes)

### Step 1: Deploy Database Migration

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your Harthio project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire content from `database/migrations/add-automated-email-scheduler.sql`
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. You should see: ✅ "automated_email_log table - Created" and "Email scheduler functions - Created"

### Step 2: Set Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add:
```
CRON_SECRET=your-random-secret-here-use-strong-password
```

Generate a strong secret:
```bash
# On Mac/Linux
openssl rand -base64 32

# Or use any password generator
```

### Step 3: Deploy to Vercel

```bash
git add .
git commit -m "Add automated email scheduler"
git push origin develop
```

Vercel will automatically deploy with the cron job.

### Step 4: Verify Cron Job

1. Go to Vercel Dashboard → Your Project → Cron Jobs
2. You should see: `/api/cron/send-automated-emails` scheduled for `0 7 * * *`
3. Click "Run Now" to test manually

### Step 5: Test Manually (Optional)

```bash
curl -X POST https://harthio.com/api/cron/send-automated-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "timestamp": "2025-11-30T07:00:00.000Z",
  "results": {
    "welcome": { "sent": 5, "failed": 0, "skipped": 0 },
    "day3": { "sent": 3, "failed": 0, "skipped": 0 },
    "week1": { "sent": 2, "failed": 0, "skipped": 0 },
    "inactive": { "sent": 1, "failed": 0, "skipped": 0 }
  }
}
```

## Email Schedule Summary

| Email Type | Audience | Frequency | Time |
|------------|----------|-----------|------|
| Welcome | 0-24 hours old | Daily | 7 AM UTC |
| Day 3 Follow-up | 1-3 days old | Daily | 7 AM UTC |
| Week 1 Check-in | 3-7 days old | Daily | 7 AM UTC |
| Re-engagement | 30+ days inactive | Daily (max 1 per 35 days) | 7 AM UTC |

## Monitoring

### Check Email Logs
```sql
-- Recent sends
SELECT 
  email_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM automated_email_log
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY email_type;

-- Failed sends
SELECT * FROM automated_email_log
WHERE status = 'failed'
ORDER BY sent_at DESC
LIMIT 20;
```

### Vercel Logs
1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by: `/api/cron/send-automated-emails`
3. Check for errors or issues

## Troubleshooting

**Cron not running?**
- Check Vercel Dashboard → Cron Jobs tab
- Verify cron is enabled
- Check project has Pro plan (required for cron)

**Emails not sending?**
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for errors
- Review `automated_email_log` table

**Getting 401 Unauthorized?**
- Verify `CRON_SECRET` matches in Vercel and request
- Check Authorization header format: `Bearer YOUR_SECRET`

## Manual Email Campaigns

For announcement emails (like new features), use the Admin Panel:
1. Go to `/admin-v2/campaigns`
2. Select template
3. Choose audience
4. Send manually

The automated system only handles onboarding and re-engagement emails.

## Done! ✅

Your automated email system is now live and will run daily at 7 AM UTC.

Monitor the first few runs to ensure everything works correctly.
