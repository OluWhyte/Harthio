# Unsubscribe System & Custom Emails - Implementation Guide

## ✅ What's Been Added

### 1. Unsubscribe Page (`/unsubscribe`)
- **URL**: `https://harthio.com/unsubscribe?token=USER_ID`
- **Functionality**: Users can unsubscribe from marketing emails
- **Database**: Updates `user_email_preferences` table

### 2. Custom Email Input
- **Feature**: Send campaigns to specific email addresses
- **Use Case**: Send to 1-2 people for testing or personal reasons
- **Bypass**: Custom emails bypass unsubscribe preferences

---

## 🔐 Unsubscribe System

### How It Works

**1. Email Contains Unsubscribe Link:**
```html
<a href="{{appUrl}}/unsubscribe?token={{unsubscribeToken}}">Unsubscribe</a>
```

**2. User Clicks Link:**
- Goes to `/unsubscribe?token=USER_ID`
- System updates their preferences
- Shows confirmation page

**3. Database Update:**
```sql
UPDATE user_email_preferences
SET unsubscribed_marketing = true,
    unsubscribed_at = NOW()
WHERE user_id = 'USER_ID';
```

### What Happens After Unsubscribe

**✅ User WILL Still Receive:**
- Join request notifications (transactional)
- Password reset emails (transactional)
- Session reminders (transactional)
- Account-related emails (transactional)

**❌ User Will NOT Receive:**
- Marketing campaigns (Welcome, Follow-up, etc.)
- Promotional emails
- Feature announcements
- Re-engagement emails

### Personal Email Workaround

**Q: If they unsubscribe, can I still email them personally?**

**A: Yes! Two ways:**

**Option 1: Use Custom Email List**
- Select "Custom Email List" in audience
- Enter their email address
- Custom emails bypass unsubscribe preferences
- Perfect for personal outreach

**Option 2: Email Directly from Zoho**
- Use your Zoho mailbox (tosin@harthio.com)
- Send personal emails outside the campaign system
- Not affected by unsubscribe status

---

## 📧 Custom Email Feature

### How to Use

**1. In Admin Panel (`/admin/campaigns`):**
- Select template
- Choose "Custom Email List" as audience
- Enter email addresses (comma or newline separated)

**2. Email Input Format:**
```
email1@example.com, email2@example.com
email3@example.com
email4@example.com, email5@example.com
```

**3. System Parses:**
- Splits by comma or newline
- Trims whitespace
- Validates email format
- Shows count of valid emails

### Use Cases

**Testing:**
```
your-email@gmail.com
colleague@company.com
```

**Personal Outreach:**
```
investor@vc.com
partner@company.com
```

**VIP Users:**
```
power-user1@email.com
power-user2@email.com
```

### Important Notes

- ✅ Custom emails bypass unsubscribe preferences
- ✅ No limit on number of emails
- ✅ Works with any email address (not just users)
- ✅ Still tracked in campaign history
- ⚠️ Use responsibly - respect privacy

---

## 🎯 Email Types & Unsubscribe

### Marketing Emails (Affected by Unsubscribe)
- Welcome Email
- Day 3 Follow-up
- Week 1 Check-in
- Re-engagement
- Feature Announcements
- Newsletters

**Sent From:** tosin@harthio.com or seyi@harthio.com

**Unsubscribe:** ✅ Users can opt out

### Transactional Emails (NOT Affected)
- Join request notifications
- Request approved/declined
- Password reset
- Email verification
- Session reminders

**Sent From:** no-reply@harthio.com

**Unsubscribe:** ❌ Users cannot opt out (required for service)

### Custom Campaigns (Bypass Unsubscribe)
- Personal outreach
- VIP communications
- Testing
- One-off messages

**Sent From:** Any (tosin@, seyi@, no-reply@)

**Unsubscribe:** ⚠️ Bypasses preferences (use responsibly)

---

## 📊 Database Schema

### user_email_preferences Table

```sql
CREATE TABLE user_email_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  unsubscribed_marketing BOOLEAN DEFAULT FALSE,
  unsubscribed_all BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMP,
  preferences JSONB DEFAULT '{}'
);
```

**Fields:**
- `unsubscribed_marketing` - Opted out of marketing emails
- `unsubscribed_all` - Opted out of ALL emails (not used yet)
- `unsubscribed_at` - When they unsubscribed
- `preferences` - Future: granular preferences (weekly digest, etc.)

---

## 🔄 Re-subscribe Process

**Currently:** Users need to contact support

**Future Enhancement:**
- Add re-subscribe page
- Add preference center in account settings
- Allow granular control (weekly digest, announcements only, etc.)

---

## 🧪 Testing

### Test Unsubscribe Flow

**1. Send Test Campaign:**
```
Admin Panel → Campaigns → Custom Email List
Enter: your-test-email@gmail.com
Send campaign
```

**2. Check Email:**
- Open email
- Find unsubscribe link at bottom
- Click link

**3. Verify Unsubscribe:**
- Should see success page
- Check database:
```sql
SELECT * FROM user_email_preferences 
WHERE user_id = 'USER_ID';
```

**4. Test Marketing Block:**
- Try sending another marketing campaign
- User should NOT receive it

**5. Test Transactional Still Works:**
- Send join request to that user
- They SHOULD still receive it

### Test Custom Emails

**1. Create Custom Campaign:**
```
Audience: Custom Email List
Emails: test1@email.com, test2@email.com
```

**2. Verify:**
- Both emails receive campaign
- Works even if they're unsubscribed
- Tracked in campaign history

---

## ⚖️ Legal Compliance

### CAN-SPAM Act Requirements

**✅ Implemented:**
- Unsubscribe link in every marketing email
- Clear "from" address
- Honest subject lines
- Physical address in footer (add if needed)

**✅ Best Practices:**
- Honor unsubscribes immediately
- Separate marketing from transactional
- Clear opt-out process
- Confirmation page

**⚠️ Custom Emails:**
- Use responsibly
- Don't spam
- Respect privacy
- Only for legitimate purposes

---

## 🚀 Deployment Checklist

- [x] Unsubscribe page created
- [x] Custom email input added
- [x] Database schema supports preferences
- [x] Marketing emails respect unsubscribe
- [x] Transactional emails bypass unsubscribe
- [x] Custom emails bypass unsubscribe
- [ ] Test unsubscribe flow in production
- [ ] Test custom emails in production
- [ ] Add physical address to email footer (legal requirement)

---

## 📝 Future Enhancements

### Phase 2:
- Re-subscribe page
- Preference center in account settings
- Granular preferences (weekly digest, announcements only)
- Email frequency capping

### Phase 3:
- A/B testing for subject lines
- Send time optimization
- Engagement scoring
- Automatic re-engagement campaigns

---

## 🆘 Support

**If User Can't Unsubscribe:**
1. Check unsubscribe link works
2. Manually update database:
```sql
UPDATE user_email_preferences
SET unsubscribed_marketing = true
WHERE user_id = 'USER_ID';
```
3. Confirm with user

**If Custom Emails Not Working:**
1. Check email format is valid
2. Verify "Custom Email List" is selected
3. Check campaign history for send status
4. Review Vercel logs for errors

---

## Quick Reference

**Unsubscribe URL Format:**
```
https://harthio.com/unsubscribe?token=USER_ID
```

**Custom Email Format:**
```
email1@example.com, email2@example.com
email3@example.com
```

**Check Unsubscribe Status:**
```sql
SELECT * FROM user_email_preferences 
WHERE user_id = 'USER_ID';
```

**Manually Unsubscribe User:**
```sql
INSERT INTO user_email_preferences (user_id, unsubscribed_marketing, unsubscribed_at)
VALUES ('USER_ID', true, NOW())
ON CONFLICT (user_id) 
DO UPDATE SET unsubscribed_marketing = true, unsubscribed_at = NOW();
```
