# 📧 Resend Email Setup Guide

## Quick Setup Steps

### 1. Get Your Resend API Key

1. **Sign up at [resend.com](https://resend.com)**
2. **Go to your dashboard**
3. **Navigate to "API Keys" section**
4. **Click "Create API Key"**
5. **Copy the key** (starts with `re_`)

### 2. Update Your Environment Variables

Replace `your_resend_api_key_here` in your `.env.local` file:

```env
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM_ADDRESS=Harthio <no-reply@harthio.com>
```

### 3. (Optional) Verify Your Domain

For better deliverability and to use `no-reply@harthio.com`:

1. **In Resend dashboard, go to "Domains"**
2. **Click "Add Domain"**
3. **Enter `harthio.com`**
4. **Add the DNS records** they provide to your domain
5. **Wait for verification** (usually takes a few minutes)

Without domain verification, emails will be sent from a Resend subdomain but will still work.

### 4. Test the System

Run the test script to verify everything works:

```bash
npm run dev
node test-email-system.js
```

## What's Already Implemented

✅ **Complete email flow for requests:**
- User A sends request → Email to User B
- User B approves → Emails to both users with session link
- User B declines → Email to User A
- User A cancels → Email to User B

✅ **Beautiful HTML email templates** with:
- Responsive design
- Branded styling
- Clear call-to-action buttons
- Fallback text versions

✅ **Robust error handling:**
- Graceful fallbacks if email fails
- In-app notifications still work
- Console logging for debugging

## Email Templates Included

1. **New Request Email** - Sent to session host when someone requests to join
2. **Request Approved Email** - Sent to requester when approved
3. **Request Approved Confirmation** - Sent to host as confirmation
4. **Request Declined Email** - Sent to requester when declined
5. **Request Cancelled Email** - Sent to host when requester cancels

## Testing

Once you add your Resend API key, the system will automatically:
- Send real emails in production
- Log emails to console in development (if Resend fails)
- Continue working even if email service is down

## Cost

Resend offers:
- **3,000 emails/month free**
- **$20/month for 50,000 emails**
- **$80/month for 500,000 emails**

Perfect for your current needs!

## Support

If you need help:
1. Check the console logs for detailed error messages
2. Verify your API key is correct
3. Ensure your domain is verified (if using custom domain)
4. Test with the provided test script

Your email notification system is ready to go! 🚀