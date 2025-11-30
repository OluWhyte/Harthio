# Automated Email System

## Overview

Harthio has an automated email system that sends onboarding and re-engagement emails to users at specific intervals. All emails are sent daily at **7:00 AM UTC**.

## Email Sequence

### 1. Welcome Email (0-24 hours)
- **Template**: "Welcome Email"
- **Sender**: Tosin from Harthio <tosin@harthio.com>
- **Audience**: Users registered in the last 24 hours
- **Frequency**: Daily at 7 AM
- **Purpose**: Welcome new users and encourage first session creation

### 2. Day 3 Follow-up (1-3 days)
- **Template**: "Day 3 Follow-up"
- **Sender**: Tosin from Harthio <tosin@harthio.com>
- **Audience**: Users registered 1-3 days ago
- **Frequency**: Daily at 7 AM
- **Purpose**: Check in and provide tips for getting started

### 3. Week 1 Check-in (3-7 days)
- **Template**: "Week 1 Check-in"
- **Sender**: Tosin from Harthio <tosin@harthio.com>
- **Audience**: Users registered 3-7 days ago
- **Frequency**: Daily at 7 AM
- **Purpose**: Gather feedback and encourage continued engagement

### 4. Re-engagement (30+ days inactive)
- **Template**: "Re-engagement"
- **Sender**: Tosin from Harthio <tosin@harthio.com>
- **Audience**: Users inactive for 30+ days
- **Frequency**: Daily at 7 AM (max once per 35 days per user)
- **Purpose**: Bring back inactive users

## Technical Implementation

### Database Tables

**`automated_email_log`**
- Tracks all automated email sends
- Prevents duplicate sends
- Stores send status and errors

### Database Functions

- `get_users_for_welcome_email()` - Returns users needing welcome email
- `get_users_for_day3_email()` - Returns users needing day 3 follow-up
- `get_users_for_week1_email()` - Returns users needing week 1 check-in
- `get_users_for_inactive_email()` - Returns inactive users
- `log_automated_email()` - Logs email send attempts
- `has_received_email()` - Checks if user received specific email type

### API Endpoint

**`/api/cron/send-automated-emails`**
- Called by Vercel Cron daily at 7 AM UTC
- Requires `CRON_SECRET` in Authorization header
- Runs all email jobs sequentially
- Returns results for each job

### Vercel Cron Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/send-automated-emails",
      "schedule": "0 7 * * *"
    }
  ]
}
```

Schedule format: `minute hour day month dayOfWeek`
- `0 7 * * *` = Every day at 7:00 AM UTC

## Environment Variables

Required in Vercel:
- `CRON_SECRET` - Secret token to authenticate cron requests
- `RESEND_API_KEY` - Resend API key for sending emails
- `EMAIL_FROM_ADDRESS` - Default sender email (fallback)

## Email Preferences & Unsubscribe

Users can unsubscribe from marketing emails via:
- Unsubscribe link in email footer
- Email preferences page

The system automatically:
- Skips users who unsubscribed from marketing
- Skips users who unsubscribed from all emails
- Respects user preferences in real-time

## Rate Limiting

- 3 seconds delay between each email
- Respects Resend's rate limits (2 emails/second)
- Sequential sending to avoid 429 errors

## Monitoring & Logs

All email sends are logged with:
- User ID
- Email type
- Template ID
- Send status (sent/failed/skipped)
- Error messages (if failed)
- Timestamp

View logs in database:
```sql
SELECT * FROM automated_email_log 
ORDER BY sent_at DESC 
LIMIT 100;
```

## Manual Testing

### Test the cron endpoint locally:
```bash
curl -X POST http://localhost:3000/api/cron/send-automated-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test individual email jobs:
```typescript
import { automatedEmailScheduler } from '@/lib/automated-email-scheduler';

// Test welcome emails
await automatedEmailScheduler.sendWelcomeEmails();

// Test day 3 emails
await automatedEmailScheduler.sendDay3Emails();

// Test week 1 emails
await automatedEmailScheduler.sendWeek1Emails();

// Test inactive emails
await automatedEmailScheduler.sendInactiveEmails();

// Run all jobs
await automatedEmailScheduler.runAllJobs();
```

## Deployment Checklist

1. ✅ Deploy database migration: `add-automated-email-scheduler.sql`
2. ✅ Set `CRON_SECRET` in Vercel environment variables
3. ✅ Verify `RESEND_API_KEY` is set
4. ✅ Deploy code with cron configuration
5. ✅ Test cron endpoint manually
6. ✅ Monitor first automated run at 7 AM UTC
7. ✅ Check `automated_email_log` table for results

## Troubleshooting

### Emails not sending
- Check Vercel cron logs in dashboard
- Verify `CRON_SECRET` matches in code and Vercel
- Check `automated_email_log` for error messages
- Verify Resend API key is valid

### Duplicate emails
- Check `automated_email_log` for duplicate entries
- Verify `has_received_email()` function is working
- Check database indexes are created

### Wrong timing
- Verify Vercel cron schedule: `0 7 * * *`
- Check Vercel project timezone settings
- Monitor Vercel cron execution logs

## Future Enhancements

- [ ] Add timezone support for personalized send times
- [ ] A/B testing for email content
- [ ] Email open/click tracking
- [ ] Dynamic content based on user behavior
- [ ] Smart send time optimization
- [ ] Email preview before automated send
