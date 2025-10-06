# Email Notification Setup Guide

## Overview
Comprehensive email notification system for the request flow:
- User A sends request → Email to User B
- User B approves → Email to both users
- User B declines → Email to User A
- User A cancels → Email to User B

## Setup Steps

### 1. Choose Email Provider

**Option A: Resend (Recommended)**
```bash
npm install resend
```
Add to `.env.local`:
```env
RESEND_API_KEY=your_resend_key_here
EMAIL_FROM_ADDRESS=noreply@harthio.com
```

**Option B: Supabase SMTP**
Configure in Supabase Dashboard > Authentication > SMTP Settings

### 2. Update API Route
Update `src/app/api/send-email/route.ts` with your provider:

```typescript
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: "Harthio <noreply@harthio.com>",
  to: [to],
  subject: subject,
  html: html,
});
```

### 3. Test Email Flow
1. Create a test session
2. Send a join request
3. Check console logs (development mode)
4. Configure provider for production emails

## Email Templates
- Beautiful HTML design with responsive layout
- Personalized content with user names
- Clear call-to-action buttons
- Professional branding

## Current Status
✅ Email templates complete
✅ Integration points ready
⏳ Email provider configuration needed