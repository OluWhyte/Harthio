# Email Campaigns Deployment Guide

## Overview
This guide will help you deploy the email campaigns feature to your Harthio application.

## What's Been Built

### 1. Database Schema
- `email_templates` - Pre-built email templates
- `email_campaigns` - Campaign tracking
- `email_campaign_sends` - Individual send tracking
- `user_email_preferences` - Unsubscribe management

### 2. Backend Service
- `src/lib/email-campaign-service.ts` - Campaign management service
- Updated `src/lib/email-service.ts` - Support for custom from addresses
- Updated `src/app/api/send-email/route.ts` - Handle custom from addresses

### 3. Admin UI
- `src/app/admin/campaigns/page.tsx` - Campaign management interface
- Added "Campaigns" link to admin navigation

### 4. Pre-built Templates
- Welcome Email - "What would you like to talk about?"
- Day 3 Follow-up - "How's your Harthio experience going?"
- Week 1 Check-in - "Your first week on Harthio"
- Re-engagement - "We miss you on Harthio!"

---

## Deployment Steps

### Step 1: Deploy Database Schema

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/[your-project]/sql

2. **Run the Schema SQL**
   - Open `database/email-campaigns-schema.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Verify Tables Created**
   - Go to: Table Editor
   - Check that these tables exist:
     - `email_templates` (should have 4 pre-built templates)
     - `email_campaigns`
     - `email_campaign_sends`
     - `user_email_preferences`

### Step 2: Verify Resend Setup

1. **Check Domain Verification**
   - Go to: https://resend.com/domains
   - Verify `harthio.com` shows all green checkmarks

2. **Test Sending from tosin@**
   - Go to: https://resend.com/emails
   - Click "Send Test Email"
   - From: `tosin@harthio.com`
   - To: Your email
   - Send and verify it arrives

3. **Test Sending from seyi@**
   - Same process with `seyi@harthio.com`

### Step 3: Deploy Code

1. **Commit and Push**
   ```bash
   git add .
   git commit -m "Add email campaigns feature"
   git push
   ```

2. **Wait for Vercel Deployment**
   - Vercel will auto-deploy from GitHub
   - Check deployment status in Vercel dashboard

3. **Verify Deployment**
   - Go to: https://harthio.com/admin/campaigns
   - You should see the campaigns interface

### Step 4: Test the Feature

1. **Access Admin Panel**
   - Go to: https://harthio.com/admin/campaigns
   - Login with admin credentials

2. **Send Test Campaign**
   - Select "Welcome Email" template
   - Choose "All Users" audience
   - From: `tosin@harthio.com`
   - Click "Preview" to see how it looks
   - Click "Send Test" (send to yourself first)

3. **Verify Email Received**
   - Check your inbox
   - Verify from address is correct
   - Verify content looks good
   - Test reply functionality

4. **Send to Small Group**
   - Select "New Users (Last 3 Days)" audience
   - This will be a smaller group for testing
   - Send campaign
   - Monitor for any errors

---

## Features Overview

### Campaign Management

**Send Campaign Tab:**
- Select from 4 pre-built templates
- Choose audience (All, New, Active, Inactive users)
- Select from email (tosin@, seyi@, no-reply@)
- Optional custom subject line
- Preview before sending
- See recipient count before sending

**Campaign History Tab:**
- View all sent campaigns
- See stats (sent, failed, recipients)
- Delete old campaigns

### Email Templates

**1. Welcome Email**
- **When to use:** Immediately after user signs up
- **From:** tosin@harthio.com (personal touch)
- **Goal:** Get user to create first session
- **Subject:** "Welcome to Harthio - What would you like to talk about?"

**2. Day 3 Follow-up**
- **When to use:** 3 days after signup if no activity
- **From:** tosin@harthio.com
- **Goal:** Encourage first session
- **Subject:** "How's your Harthio experience going?"

**3. Week 1 Check-in**
- **When to use:** 7 days after signup
- **From:** tosin@harthio.com
- **Goal:** Gather feedback
- **Subject:** "Your first week on Harthio"

**4. Re-engagement**
- **When to use:** 30+ days inactive
- **From:** tosin@harthio.com
- **Goal:** Bring users back
- **Subject:** "We miss you on Harthio!"

### Audience Filters

**All Users:**
- Every user in the database
- Use for: Major announcements, feature launches

**New Users (Last 3 Days):**
- Users who signed up in last 3 days
- Use for: Welcome emails, onboarding

**Active Users (Last 30 Days):**
- Users who logged in within last 30 days
- Use for: Feature announcements, engagement

**Inactive Users (30+ Days):**
- Users who haven't logged in for 30+ days
- Use for: Re-engagement campaigns

---

## Best Practices

### Sending Strategy

1. **Start Small**
   - Test with yourself first
   - Then send to "New Users" (smaller group)
   - Monitor for issues
   - Then scale to larger audiences

2. **Timing**
   - Best days: Tuesday, Wednesday, Thursday
   - Best times: 10am - 2pm (user's timezone)
   - Avoid weekends and late nights

3. **Frequency**
   - Don't spam users
   - Welcome: Immediate
   - Follow-up: 3 days later
   - Check-in: 7 days later
   - Re-engagement: 30+ days later

4. **From Address**
   - Use `tosin@harthio.com` for personal campaigns
   - Use `seyi@harthio.com` for team communications
   - Use `no-reply@harthio.com` for system notifications

### Email Content

1. **Subject Lines**
   - Keep under 50 characters
   - Personal and conversational
   - Create curiosity
   - Avoid spam words (FREE, URGENT, etc.)

2. **Body Content**
   - Short and scannable
   - One clear call-to-action
   - Personal tone (you're the founder!)
   - Mobile-friendly

3. **Personalization**
   - Uses {{firstName}} variable
   - Falls back to "there" if no name
   - Feels personal, not automated

### Monitoring

1. **Check Campaign History**
   - Monitor sent vs failed counts
   - High failure rate? Check email addresses in database

2. **Watch for Replies**
   - Replies go to your Zoho mailbox
   - Respond to user feedback
   - Use insights to improve

3. **Unsubscribes**
   - Every email has unsubscribe link
   - Users can opt out
   - System respects preferences

---

## Troubleshooting

### Issue: "No templates found"
**Solution:** Run the database schema SQL again

### Issue: "Failed to send emails"
**Solutions:**
- Check Resend API key in Vercel env vars
- Verify domain in Resend dashboard
- Check Vercel logs for specific errors

### Issue: "Emails going to spam"
**Solutions:**
- Verify DKIM is set up (green in Resend)
- Add DMARC record (see RESEND_EMAIL_SETUP_GUIDE.md)
- Warm up sender addresses (start small, scale up)

### Issue: "Wrong from address"
**Solution:** Check that you selected the correct from email in the dropdown

### Issue: "Audience count is 0"
**Solutions:**
- Check that you have users in database
- Verify audience filter is correct
- Check that users haven't all unsubscribed

---

## Future Enhancements

### Phase 2 (When you have 100+ users):
- Automated drip campaigns
- A/B testing for subject lines
- Open/click tracking
- Scheduled sends

### Phase 3 (When you have 1000+ users):
- Integration with Loops.so or Customer.io
- Advanced segmentation
- Behavioral triggers
- Email analytics dashboard

---

## Security & Compliance

### Unsubscribe Management
- Every email includes unsubscribe link
- Link format: `{{appUrl}}/unsubscribe?token={{unsubscribeToken}}`
- Users can opt out of marketing emails
- System respects preferences automatically

### Data Privacy
- Only sends to users who haven't unsubscribed
- Stores minimal tracking data
- Complies with CAN-SPAM Act

### Rate Limiting
- Sends in batches of 10
- 1-second delay between batches
- Prevents overwhelming Resend API

---

## Support

If you encounter issues:
1. Check Vercel logs for errors
2. Check Resend dashboard for failed sends
3. Review this guide's troubleshooting section
4. Check `RESEND_EMAIL_SETUP_GUIDE.md` for email setup

---

## Quick Start Checklist

- [ ] Deploy database schema to Supabase
- [ ] Verify 4 templates exist in database
- [ ] Test sending from tosin@harthio.com
- [ ] Test sending from seyi@harthio.com
- [ ] Deploy code to Vercel
- [ ] Access /admin/campaigns
- [ ] Send test email to yourself
- [ ] Send campaign to small group
- [ ] Monitor campaign history
- [ ] Check for replies in Zoho

---

## Files Created/Modified

**New Files:**
- `database/email-campaigns-schema.sql`
- `src/lib/email-campaign-service.ts`
- `src/app/admin/campaigns/page.tsx`
- `RESEND_EMAIL_SETUP_GUIDE.md`
- `EMAIL_CAMPAIGNS_DEPLOYMENT.md`

**Modified Files:**
- `src/lib/email-service.ts` - Added custom from address support
- `src/app/api/send-email/route.ts` - Handle custom from addresses
- `src/components/admin/admin-nav.tsx` - Added Campaigns link

---

Ready to deploy! Follow the steps above and you'll be sending campaigns in no time. 🚀
