# Email Campaigns - Improvements & Updates

## Updates Needed

### 1. ✅ Add 7-Day Audience Filter
**Current:** 3 days, 30 days
**Add:** 7 days option

### 2. ✅ Custom Email Template
**Feature:** Allow writing custom emails without using templates

### 3. ⏳ Email Alerts (Optional - Future)
**Feature:** Get notified when users need emails
**Examples:**
- "5 users signed up 3 days ago - send Day 3 follow-up"
- "12 users inactive for 30 days - send re-engagement"

### 4. ✅ Dynamic Email Signatures
**Current:** Only Tosin signature
**Update:** Change signature based on sender
- tosin@harthio.com → Tosin signature
- seyi@harthio.com → Seyi signature  
- no-reply@harthio.com → No signature / Generic

### 5. ✅ Verify Email Links
**Check all links work and go to useful pages:**
- Dashboard link
- Unsubscribe link
- App homepage

---

## Implementation Plan

### Update 1: Add 7-Day Audience Filter

**In `src/lib/email-campaign-service.ts`:**
```typescript
case 'new_users_7d':
  // Users created in last 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  query = query.gte('created_at', sevenDaysAgo.toISOString());
  break;
```

**In `src/app/admin/campaigns/page.tsx`:**
```typescript
<SelectItem value="new_users_7d">
  <div className="flex items-center gap-2">
    <Clock className="h-4 w-4" />
    New Users (Last 7 Days)
  </div>
</SelectItem>
```

### Update 2: Custom Email Template

**Add to campaign form:**
```typescript
const [useCustomTemplate, setUseCustomTemplate] = useState(false);
const [customSubject, setCustomSubject] = useState("");
const [customHtml, setCustomHtml] = useState("");
const [customText, setCustomText] = useState("");
```

**UI:**
```tsx
<div className="space-y-2">
  <Label>
    <input 
      type="checkbox" 
      checked={useCustomTemplate}
      onChange={(e) => setUseCustomTemplate(e.target.checked)}
    />
    Use Custom Email (Write your own)
  </Label>
</div>

{useCustomTemplate && (
  <>
    <Input 
      placeholder="Email Subject"
      value={customSubject}
      onChange={(e) => setCustomSubject(e.target.value)}
    />
    <Textarea 
      placeholder="Email Content (HTML supported)"
      value={customHtml}
      onChange={(e) => setCustomHtml(e.target.value)}
      rows={10}
    />
  </>
)}
```

### Update 3: Dynamic Email Signatures

**Update email templates to use dynamic signature:**

```typescript
// In email-campaign-service.ts
const getEmailSignature = (fromEmail: string): string => {
  if (fromEmail.includes('tosin@')) {
    return `
      <p>Best,<br><strong>Tosin</strong><br>Founder, Harthio</p>
    `;
  } else if (fromEmail.includes('seyi@')) {
    return `
      <p>Best regards,<br><strong>Seyi</strong><br>Co-founder, Harthio</p>
    `;
  } else {
    // no-reply or generic
    return `
      <p>Best regards,<br><strong>The Harthio Team</strong></p>
    `;
  }
};

// Replace signature in template
htmlContent = htmlContent.replace(
  /<p>Best,<br><strong>Tosin<\/strong><br>Founder, Harthio<\/p>/g,
  getEmailSignature(campaign.from_email)
);
```

### Update 4: Email Alert System (Future)

**Option A: Manual Check in Admin Dashboard**
```typescript
// Add to admin dashboard
const getEmailSuggestions = async () => {
  const suggestions = [];
  
  // Check for 3-day users
  const threeDayUsers = await getAudienceCount('new_users_3d');
  if (threeDayUsers > 0) {
    suggestions.push({
      type: 'Day 3 Follow-up',
      count: threeDayUsers,
      template: 'Day 3 Follow-up',
      audience: 'new_users_3d'
    });
  }
  
  // Check for 7-day users
  const sevenDayUsers = await getAudienceCount('new_users_7d');
  if (sevenDayUsers > 0) {
    suggestions.push({
      type: 'Week 1 Check-in',
      count: sevenDayUsers,
      template: 'Week 1 Check-in',
      audience: 'new_users_7d'
    });
  }
  
  // Check for inactive users
  const inactiveUsers = await getAudienceCount('inactive_users');
  if (inactiveUsers > 0) {
    suggestions.push({
      type: 'Re-engagement',
      count: inactiveUsers,
      template: 'Re-engagement',
      audience: 'inactive_users'
    });
  }
  
  return suggestions;
};
```

**Option B: Email Notifications (Advanced)**
- Set up cron job to check daily
- Send email to tosin@harthio.com with suggestions
- Requires external service (Vercel Cron, etc.)

**Option C: Dashboard Badge**
```tsx
<Badge variant="destructive">
  {suggestions.length} campaigns suggested
</Badge>
```

### Update 5: Verify Email Links

**Links to Check:**

1. **Dashboard Link:** `{{appUrl}}/dashboard`
   - ✅ Should go to: https://harthio.com/dashboard
   - Shows user's sessions and requests

2. **Requests Link:** `{{appUrl}}/requests`
   - ✅ Should go to: https://harthio.com/requests
   - Shows join requests

3. **Session Link:** `{{appUrl}}/session/{{sessionId}}`
   - ✅ Should go to: https://harthio.com/session/[id]
   - Opens video call session

4. **Unsubscribe Link:** `{{appUrl}}/unsubscribe?token={{unsubscribeToken}}`
   - ⚠️ Need to create: https://harthio.com/unsubscribe
   - Allows users to opt out

5. **Homepage:** `{{appUrl}}`
   - ✅ Should go to: https://harthio.com
   - Main landing page

**Missing Page: Unsubscribe**
Need to create: `src/app/unsubscribe/page.tsx`

---

## Priority Implementation

### High Priority (Do Now):
1. ✅ Add 7-day audience filter
2. ✅ Dynamic email signatures
3. ⚠️ Create unsubscribe page

### Medium Priority (Next Week):
4. Custom email template option
5. Email suggestions in dashboard

### Low Priority (Future):
6. Automated email alerts
7. Scheduled campaigns

---

## Quick Fixes Needed

### 1. Update Audience Filters
```typescript
// Add to email-campaign-service.ts
case 'new_users_7d':
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  query = query.gte('created_at', sevenDaysAgo.toISOString());
  break;
```

### 2. Update UI Dropdown
```tsx
// Add to campaigns/page.tsx
<SelectItem value="new_users_7d">
  New Users (Last 7 Days)
</SelectItem>
```

### 3. Create Unsubscribe Page
```tsx
// src/app/unsubscribe/page.tsx
export default function UnsubscribePage() {
  // Handle unsubscribe token
  // Update user_email_preferences
  // Show confirmation message
}
```

### 4. Update Email Templates
```typescript
// Replace static signature with dynamic one
const signature = getEmailSignature(fromEmail);
htmlContent = htmlContent.replace('{{signature}}', signature);
```

---

## Testing Checklist

After implementing:

- [ ] Test 7-day audience filter shows correct count
- [ ] Test custom email sends successfully
- [ ] Test Tosin signature appears for tosin@harthio.com
- [ ] Test Seyi signature appears for seyi@harthio.com
- [ ] Test no signature for no-reply@harthio.com
- [ ] Test all email links work
- [ ] Test unsubscribe page works
- [ ] Test unsubscribe link in emails works

---

## Email Link Verification

### Current Links in Templates:

**Welcome Email:**
- `{{appUrl}}/dashboard` ✅ Works
- `{{appUrl}}/unsubscribe?token={{unsubscribeToken}}` ⚠️ Need to create page

**Day 3 Follow-up:**
- `{{appUrl}}/dashboard` ✅ Works
- `{{appUrl}}/unsubscribe?token={{unsubscribeToken}}` ⚠️ Need to create page

**Week 1 Check-in:**
- `{{appUrl}}/dashboard` ✅ Works
- `{{appUrl}}/unsubscribe?token={{unsubscribeToken}}` ⚠️ Need to create page

**Re-engagement:**
- `{{appUrl}}/dashboard` ✅ Works
- `{{appUrl}}/unsubscribe?token={{unsubscribeToken}}` ⚠️ Need to create page

**All Templates:**
- `{{appUrl}}` ✅ Works (homepage)

### Action Required:
Create unsubscribe page at `/unsubscribe`

---

## Summary

**What's Working:**
- ✅ Basic campaign system
- ✅ 4 pre-built templates
- ✅ Audience filtering (3 days, 30 days, all)
- ✅ Multiple from addresses
- ✅ Dashboard and homepage links

**What Needs Update:**
- ⚠️ Add 7-day audience filter
- ⚠️ Dynamic email signatures
- ⚠️ Create unsubscribe page
- 💡 Custom email template (nice to have)
- 💡 Email suggestions (nice to have)

**Priority Order:**
1. Create unsubscribe page (required for compliance)
2. Add 7-day audience filter (requested)
3. Dynamic signatures (requested)
4. Custom templates (optional)
5. Email alerts (future)

Would you like me to implement these updates now?
