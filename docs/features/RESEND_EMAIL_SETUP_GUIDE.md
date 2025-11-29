# Resend Email Setup Guide - Adding tosin@ and seyi@ Emails

## Current Status
✅ Domain `harthio.com` is verified in Resend  
✅ `no-reply@harthio.com` is working  
✅ DNS records are configured  

## What We're Adding
- `tosin@harthio.com` - For personal campaigns and engagement
- `seyi@harthio.com` - For team campaigns (if needed)

---

## Step 1: Verify Domain is Fully Set Up

### 1.1 Check Resend Dashboard
1. Go to: https://resend.com/domains
2. Find `harthio.com` in the list
3. Check that all records show ✅ green checkmarks:
   - ✅ Domain Verification (TXT record)
   - ✅ DKIM Signing (CNAME record)
   - ✅ SPF Record (TXT record)

**If all are green, you're good to go! Skip to Step 2.**

**If any are red/yellow:**
- Click on the domain to see which records need fixing
- Follow the DNS instructions shown
- Wait 5-10 minutes for DNS propagation
- Click "Verify" button

---

## Step 2: Test Sending from tosin@harthio.com

### 2.1 Quick Test via Resend Dashboard
1. Go to: https://resend.com/emails
2. Click "Send Test Email" button
3. Fill in:
   ```
   From: tosin@harthio.com
   To: [your personal email]
   Subject: Test from Tosin
   Body: This is a test email
   ```
4. Click "Send"
5. Check your inbox (and spam folder)

**Expected Result:**
- ✅ Email arrives from tosin@harthio.com
- ✅ Reply-to is tosin@harthio.com
- ✅ When you reply, it goes to your Zoho mailbox

**If it works:** Perfect! Move to Step 3.

**If it fails:** Check error message and DNS records.

---

## Step 3: Test Sending from seyi@harthio.com

### 3.1 Same Process
1. Go to: https://resend.com/emails
2. Click "Send Test Email"
3. Fill in:
   ```
   From: seyi@harthio.com
   To: [your personal email]
   Subject: Test from Seyi
   Body: This is a test email
   ```
4. Click "Send"
5. Check inbox

**Expected Result:**
- ✅ Email arrives from seyi@harthio.com
- ✅ Replies go to Zoho mailbox

---

## Step 4: Verify Reply-To Works

### 4.1 Test the Reply Flow
1. Open the test email you received from tosin@harthio.com
2. Click "Reply"
3. Check that reply address is: tosin@harthio.com
4. Send a test reply
5. Check your Zoho mailbox at tosin@harthio.com
6. Verify the reply arrived

**This confirms:**
- ✅ Sending works via Resend
- ✅ Receiving works via Zoho
- ✅ Full email flow is working

---

## Step 5: Understanding How It Works

### The Email Flow
```
┌─────────────────────────────────────────────────────────────┐
│                    SENDING EMAILS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Your App (Harthio)                                         │
│       ↓                                                      │
│  Resend API (sends email)                                   │
│       ↓                                                      │
│  Email sent FROM: tosin@harthio.com                         │
│       ↓                                                      │
│  User receives email                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   RECEIVING REPLIES                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User clicks "Reply"                                        │
│       ↓                                                      │
│  Reply goes TO: tosin@harthio.com                           │
│       ↓                                                      │
│  Zoho receives email (MX records point to Zoho)            │
│       ↓                                                      │
│  You read in Zoho webmail                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Points
- **Resend**: Only for SENDING emails
- **Zoho**: Only for RECEIVING emails
- **DNS**: Routes sending through Resend, receiving through Zoho
- **No Conflict**: They work together perfectly

---

## Step 6: DNS Records Explained (For Reference)

### What's Already Set Up
Since `no-reply@harthio.com` works, these records are already configured:

**1. MX Records (Zoho - for receiving)**
```
Priority 10: mx.zoho.com
Priority 20: mx2.zoho.com
Priority 50: mx3.zoho.com
```

**2. SPF Record (Allows Resend to send)**
```
TXT @ "v=spf1 include:zoho.com include:_spf.resend.com ~all"
```

**3. DKIM Record (Resend signing)**
```
CNAME resend._domainkey → resend.com
```

**4. Domain Verification (Resend)**
```
TXT _resend → [verification code]
```

### Why tosin@ and seyi@ Work Automatically
- Once domain is verified, ANY email @harthio.com can send via Resend
- No additional setup needed per email address
- It's domain-level, not address-level

---

## Step 7: Best Practices

### Email Addresses Strategy

**no-reply@harthio.com**
- Use for: System notifications, password resets
- Users shouldn't reply to these
- Already working ✅

**tosin@harthio.com**
- Use for: Personal campaigns, onboarding, feedback requests
- Users CAN reply (goes to Zoho)
- Builds personal connection
- Use this for "What would you like to talk about?" campaign

**seyi@harthio.com**
- Use for: Team communications, support
- Users CAN reply (goes to Zoho)
- Alternative sender for variety

**hello@harthio.com** (optional)
- Use for: General announcements, newsletters
- Professional but friendly
- Can set up later if needed

### When to Use Which Email

| Email Type | From Address | Example |
|------------|--------------|---------|
| Join Request | no-reply@harthio.com | "New join request from..." |
| Password Reset | no-reply@harthio.com | "Reset your password" |
| Welcome Email | tosin@harthio.com | "Welcome to Harthio!" |
| Day 3 Follow-up | tosin@harthio.com | "How's it going?" |
| Feature Announcement | tosin@harthio.com | "New feature: ..." |
| Re-engagement | tosin@harthio.com | "We miss you!" |
| Support Response | seyi@harthio.com | "Re: Your question..." |

---

## Step 8: Testing Checklist

Before we build the campaign tool, verify:

- [ ] Can send from no-reply@harthio.com (already working)
- [ ] Can send from tosin@harthio.com (test in Step 2)
- [ ] Can send from seyi@harthio.com (test in Step 3)
- [ ] Replies to tosin@ arrive in Zoho
- [ ] Replies to seyi@ arrive in Zoho
- [ ] All DNS records are green in Resend dashboard

---

## Step 9: Common Issues & Solutions

### Issue: "Domain not verified"
**Solution:** 
- Check DNS records in Resend dashboard
- Wait 10-15 minutes for DNS propagation
- Click "Verify" button again

### Issue: "Email rejected - SPF fail"
**Solution:**
- Check SPF record includes both Zoho and Resend
- Should be: `v=spf1 include:zoho.com include:_spf.resend.com ~all`

### Issue: "Replies not arriving in Zoho"
**Solution:**
- Check MX records still point to Zoho
- Verify Zoho mailbox is active
- Check spam folder in Zoho

### Issue: "Email goes to spam"
**Solution:**
- Verify DKIM is set up (green in Resend)
- Add DMARC record (optional but recommended)
- Warm up new sender addresses gradually

---

## Step 10: DMARC Setup (Optional but Recommended)

### What is DMARC?
- Tells email providers how to handle failed authentication
- Improves deliverability
- Prevents email spoofing

### How to Add DMARC
1. Go to your DNS provider (where you manage harthio.com)
2. Add a TXT record:
   ```
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:tosin@harthio.com
   ```
3. Wait 10-15 minutes
4. Test at: https://mxtoolbox.com/dmarc.aspx

**What this does:**
- `p=none` - Monitor only (don't reject emails)
- `rua=mailto:tosin@harthio.com` - Send reports to you
- Improves email reputation over time

---

## Next Steps

Once you've completed the testing:

1. ✅ Confirm all emails work (no-reply@, tosin@, seyi@)
2. ✅ Verify replies arrive in Zoho
3. ✅ Let me know it's working
4. 🚀 I'll build the campaign tool in admin panel

---

## Quick Reference

**Resend Dashboard:** https://resend.com/domains  
**Test Sending:** https://resend.com/emails  
**DNS Check:** https://mxtoolbox.com/SuperTool.aspx  
**DMARC Check:** https://mxtoolbox.com/dmarc.aspx  

**Your Emails:**
- no-reply@harthio.com ✅ (working)
- tosin@harthio.com ⏳ (test in Step 2)
- seyi@harthio.com ⏳ (test in Step 3)

---

## Questions?

If you encounter any issues:
1. Check the error message in Resend
2. Verify DNS records are green
3. Wait 10-15 minutes for DNS changes
4. Share the error message with me

Ready to test? Start with Step 2!
