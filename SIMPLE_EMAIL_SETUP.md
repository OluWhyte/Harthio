# Simple Email Setup Guide - Step by Step

## What This Does
Automatically sends welcome and follow-up emails to new users every day at 7 AM.

---

## Step 1: Setup Database (2 minutes)

### Go to Supabase:
1. Open https://supabase.com/dashboard
2. Click on your **Harthio** project
3. Click **SQL Editor** in the left sidebar
4. Click **+ New Query** button

### Run the Migration:
1. Open the file: `database/migrations/add-automated-email-scheduler.sql`
2. Copy ALL the content (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor (Ctrl+V)
4. Click **RUN** button (or press Ctrl+Enter)

### Verify Success:
You should see at the bottom:
```
✅ automated_email_log table - Created
✅ Email scheduler functions - Created
```

---

## Step 2: Set Secret Key in Vercel (1 minute)

### Generate a Secret:
Open your terminal and run:
```bash
# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Or just use any random password generator
```

Copy the generated secret (example: `aB3dE5fG7hI9jK1lM2nO4pQ6rS8tU0vW`)

### Add to Vercel:
1. Go to https://vercel.com/dashboard
2. Click your **Harthio** project
3. Click **Settings** tab
4. Click **Environment Variables** in left menu
5. Click **Add New**
6. Name: `CRON_SECRET`
7. Value: Paste your generated secret
8. Click **Save**

---

## Step 3: Deploy Code (1 minute)

### Push to GitHub:
```bash
git add .
git commit -m "Add automated email system"
git push origin develop
```

Vercel will automatically deploy (takes ~2 minutes).

---

## Step 4: Verify It's Working (1 minute)

### Check Vercel Cron:
1. Go to Vercel Dashboard → Your Project
2. Click **Cron Jobs** tab (in left menu)
3. You should see:
   - Path: `/api/cron/send-automated-emails`
   - Schedule: `0 7 * * *` (Every day at 7 AM)
   - Status: **Enabled** ✅

### Test Manually (Optional):
Click **Run Now** button to test immediately.

---

## Done! 🎉

Your automated email system is now live!

### What Happens Now:
- **Every day at 7 AM UTC**, the system will:
  - Send welcome emails to users registered in last 24 hours
  - Send day 3 follow-up to users registered 1-3 days ago
  - Send week 1 check-in to users registered 3-7 days ago
  - Send re-engagement to users inactive for 30+ days

### Check Logs:
Go to Supabase → SQL Editor → New Query:
```sql
-- See recent emails sent
SELECT 
  email_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM automated_email_log
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY email_type;
```

---

## Troubleshooting

**"Cron Jobs tab not showing"**
- You need Vercel Pro plan for cron jobs
- Upgrade at: https://vercel.com/account/billing

**"Emails not sending"**
- Check Vercel → Logs → Filter by `/api/cron/send-automated-emails`
- Verify `RESEND_API_KEY` is set in Vercel environment variables

**"SQL error when running migration"**
- Make sure you copied the ENTIRE file content
- Check if `email_templates` table exists (run the email templates migration first)

---

## Need Help?
Check the detailed guide: `AUTOMATED_EMAIL_DEPLOYMENT.md`
