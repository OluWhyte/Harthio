# Email Notifications Documentation

## Current Email Flow (v0.3)

This document outlines all automated emails sent during the join request flow on Harthio.

---

## Join Request Flow - Email Notifications

### 1. **New Join Request Email**
**Trigger:** User A sends a request to join User B's session  
**Sent to:** Session Host (User B)  
**From:** `no-reply@harthio.com`  
**Subject:** `New Video Call Request from [Requester Name]`  
**Function:** `notifyNewJoinRequestWithEmail()`  
**Email Service:** `sendNewRequestNotification()`  
**Status:** ✅ **ACTIVE**

**Contains:**
- Requester's name
- Session title and description
- Optional message from requester
- "Review Request" button linking to `/requests`

**Code Location:**
- Triggered in: `src/lib/supabase-services.ts` (line ~470 in `addJoinRequest()`)
- Email template: `src/lib/email-service.ts` (`emailTemplates.newRequest`)

---

### 2. **Request Approved Email (to Requester)**
**Trigger:** User B approves User A's request  
**Sent to:** Requester (User A)  
**From:** `no-reply@harthio.com`  
**Subject:** `Your Video Call Request with [Approver Name] Has Been Approved`  
**Function:** `notifyRequestApprovedWithEmail()`  
**Email Service:** `sendRequestApprovedNotification()`  
**Status:** ✅ **ACTIVE**

**Contains:**
- Approver's name
- Session title
- Session time
- "Join Video Call" button with session link
- Important reminder to join at scheduled time

**Code Location:**
- Triggered in: `src/lib/notification-service.ts` (`notifyRequestApprovedWithEmail()`)
- Email template: `src/lib/email-service.ts` (`emailTemplates.requestApproved`)

---

### 3. **Request Approved Confirmation (to Host)**
**Trigger:** User B approves User A's request  
**Sent to:** Session Host (User B)  
**From:** `no-reply@harthio.com`  
**Subject:** `Your Video Call with [Approver Name] is Ready`  
**Function:** `notifyRequestApprovedWithEmail()`  
**Email Service:** `sendRequestApprovedConfirmation()`  
**Status:** ✅ **ACTIVE**

**Contains:**
- Session title
- Session time
- "Join Video Call" button with session link
- Confirmation that the other participant was notified

**Purpose:**
- Provides host with video call link via email
- Confirms their approval action
- Serves as a reminder for the upcoming session
- Ensures both participants have equal access to session link

**Code Location:**
- Triggered in: `src/lib/notification-service.ts` (`notifyRequestApprovedWithEmail()`)
- Email template: `src/lib/email-service.ts` (`emailTemplates.requestApprovedConfirmation`)

---

### 4. **Request Declined Email**
**Trigger:** User B declines User A's request  
**Sent to:** Requester (User A)  
**From:** `no-reply@harthio.com`  
**Subject:** `Your Video Call Request Was Declined`  
**Function:** `notifyRequestRejectedWithEmail()`  
**Email Service:** `sendRequestDeclinedNotification()`  
**Status:** ✅ **ACTIVE**

**Contains:**
- Session title
- Encouraging message about trying other sessions
- "Explore Sessions" button linking to dashboard
- Reassurance that this is normal

**Code Location:**
- Triggered in: `src/lib/notification-service.ts` (`notifyRequestRejectedWithEmail()`)
- Email template: `src/lib/email-service.ts` (`emailTemplates.requestDeclined`)

---

### 5. **Request Cancelled Email**
**Trigger:** User A cancels their own request  
**Sent to:** Session Host (User B)  
**From:** `no-reply@harthio.com`  
**Subject:** `Video Call Request from [Requester Name] Has Been Canceled`  
**Function:** `notifyRequestCancelledWithEmail()`  
**Email Service:** `sendRequestCancelledNotification()`  
**Status:** ✅ **ACTIVE**

**Contains:**
- Requester's name
- Session title
- Message that no action is needed
- "View Dashboard" button

**Code Location:**
- Triggered in: `src/lib/notification-service.ts` (`notifyRequestCancelledWithEmail()`)
- Email template: `src/lib/email-service.ts` (`emailTemplates.requestCancelled`)

---

## Email Summary

| # | Email Type | Recipient | Trigger | Status |
|---|------------|-----------|---------|--------|
| 1 | New Request | Host (User B) | Request sent | ✅ Active |
| 2 | Request Approved | Requester (User A) | Request approved | ✅ Active |
| 3 | Approval Confirmation | Host (User B) | Request approved | ✅ Active |
| 4 | Request Declined | Requester (User A) | Request declined | ✅ Active |
| 5 | Request Cancelled | Host (User B) | Request cancelled | ✅ Active |

**Total Active Emails:** 5

---

## Future Enhancements

### Session Reminder Emails (Planned)

**Purpose:** Remind both participants about upcoming sessions

#### Reminder Email #1: 24 Hours Before
**Sent to:** Both participants (User A and User B)  
**Timing:** 24 hours before session start time  
**Status:** 🔮 **PLANNED**

**Should contain:**
- Session title
- Session time (with timezone)
- "Join Video Call" button
- Reminder to test camera/microphone
- Option to reschedule or cancel

#### Reminder Email #2: 1 Hour Before
**Sent to:** Both participants (User A and User B)  
**Timing:** 1 hour before session start time  
**Status:** 🔮 **PLANNED**

**Should contain:**
- Session title
- Session starting in 1 hour
- "Join Video Call" button
- Quick tech check reminder

#### Reminder Email #3: 15 Minutes Before
**Sent to:** Both participants (User A and User B)  
**Timing:** 15 minutes before session start time  
**Status:** 🔮 **PLANNED**

**Should contain:**
- Session title
- Session starting soon
- "Join Now" button (prominent)
- Last-minute preparation tips

---

## Implementation Notes

### Email Service Configuration

**Provider:** Resend  
**Domain:** harthio.com  
**Verified Emails:**
- `no-reply@harthio.com` (system notifications)
- `tosin@harthio.com` (personal campaigns)
- `seyi@harthio.com` (team communications)

**API Route:** `/api/send-email`  
**Rate Limiting:** Moderate rate limit applied  
**Fallback:** Logs email to console if Resend not configured

### Email Template Design

**Design System:**
- Primary color: `hsl(340, 82%, 52%)` (pink/red)
- Secondary color: `hsl(180, 100%, 25%)` (teal)
- Background: `hsl(240, 67%, 94%)` (light blue)
- Font: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto

**Features:**
- Responsive design
- Mobile-friendly
- Gradient headers
- Clear call-to-action buttons
- Plain text fallback included

### Security & Privacy

**OWASP Compliance:**
- Email validation using `InputSanitizer.isValidEmail()`
- Rate limiting on email API
- Security event logging
- Sanitized error messages

**User Privacy:**
- Emails only sent to directly involved users
- No CC or BCC to third parties
- Unsubscribe links (future enhancement)

---

## Testing Checklist

When testing email notifications:

- [ ] New request email arrives to host
- [ ] Approval email arrives to requester
- [ ] Approval confirmation arrives to host
- [ ] Decline email arrives to requester
- [ ] Cancellation email arrives to host
- [ ] All links work correctly
- [ ] Emails render properly on mobile
- [ ] Plain text version is readable
- [ ] No emails go to spam
- [ ] Correct sender address displayed

---

## Troubleshooting

### Email Not Received

1. Check spam/junk folder
2. Verify Resend API key is configured
3. Check email address is valid in database
4. Review server logs for errors
5. Verify DNS records (SPF, DKIM, DMARC)

### Email Goes to Spam

1. Verify DKIM signing is enabled
2. Check SPF record includes Resend
3. Add DMARC policy
4. Warm up sender domain gradually
5. Avoid spam trigger words in content

### Email Sending Fails

1. Check Resend API key validity
2. Verify domain is verified in Resend
3. Check rate limits not exceeded
4. Review error logs in `/api/send-email`
5. Test with Resend dashboard directly

---

## Related Documentation

- `RESEND_EMAIL_SETUP_GUIDE.md` - Email provider setup
- `src/lib/email-service.ts` - Email templates and service
- `src/lib/notification-service.ts` - Notification orchestration
- `src/app/api/send-email/route.ts` - Email API endpoint

---

**Last Updated:** November 18, 2025  
**Version:** v0.3  
**Status:** All current emails active and working
