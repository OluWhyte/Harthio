# Email Personalization & Logo Guide

## Issue 1: "Hi John" in All Templates

### ✅ This is CORRECT Behavior!

**What you're seeing:** Preview shows "Hi John"
**What users will see:** "Hi [Their Actual Name]"

### How It Works:

**In Preview (Admin Panel):**
```typescript
// Sample data for preview
html = html.replace(/{{firstName}}/g, "John");
```
Shows: "Hi John" (always)

**In Real Emails:**
```typescript
// Actual user data
const variables = {
  firstName: user.first_name || user.display_name || 'there'
};
```
Shows:
- "Hi Sarah" (if first_name = "Sarah")
- "Hi JohnDoe" (if no first_name, uses display_name)
- "Hi there" (if no name at all)

### Name Priority Logic:
1. **First choice:** `user.first_name` (from database)
2. **Second choice:** `user.display_name` (from database)
3. **Fallback:** "there" (if no name available)

### Examples:

| User Data | Email Shows |
|-----------|-------------|
| first_name: "Sarah" | "Hi Sarah" |
| first_name: "Michael" | "Hi Michael" |
| display_name: "JohnDoe" | "Hi JohnDoe" |
| No name | "Hi there" |

### Testing Real Names:

**Option 1: Send Test to Yourself**
1. Make sure your user account has `first_name` set
2. Send campaign to "All Users"
3. Check your inbox - will show YOUR name

**Option 2: Check Database**
```sql
SELECT 
  email,
  first_name,
  display_name,
  COALESCE(first_name, display_name, 'there') as email_will_show
FROM users
LIMIT 10;
```

---

## Issue 2: Adding Company Logo

### ✅ Logo Can Be Added!

### Option A: Update Existing Templates (Recommended)

**Run this SQL in Supabase:**
```sql
-- File: database/add-logo-to-email-templates.sql
-- This adds logo to all 4 templates
```

**What it does:**
- Adds Harthio logo to header of each template
- Logo URL: `https://harthio.com/logo.svg`
- Size: 40px height
- Position: Above the heading

### Option B: Manual Update (If SQL doesn't work)

1. Go to Supabase → Table Editor → `email_templates`
2. Edit each template's `html_content`
3. Find: `<div class="header">`
4. Add logo right after:
```html
<div class="header">
  <img src="https://harthio.com/logo.svg" alt="Harthio" style="height: 40px; margin-bottom: 20px;" />
  <h1>👋 Welcome to Harthio!</h1>
```

### Logo Requirements:

**Current Setup:**
- Logo file: `public/logo.svg`
- Accessible at: `https://harthio.com/logo.svg`
- Format: SVG (scalable, looks good everywhere)

**If logo doesn't load:**
1. Check file exists: `public/logo.svg`
2. Test URL: https://harthio.com/logo.svg
3. Alternative: Use PNG/JPG instead
4. Or host on CDN (Cloudinary, etc.)

### Logo Styling Options:

**Small logo (current):**
```html
<img src="https://harthio.com/logo.svg" alt="Harthio" style="height: 40px; margin-bottom: 20px;" />
```

**Medium logo:**
```html
<img src="https://harthio.com/logo.svg" alt="Harthio" style="height: 60px; margin-bottom: 20px;" />
```

**Large logo:**
```html
<img src="https://harthio.com/logo.svg" alt="Harthio" style="height: 80px; margin-bottom: 20px;" />
```

**Centered logo:**
```html
<div style="text-align: center;">
  <img src="https://harthio.com/logo.svg" alt="Harthio" style="height: 50px; margin-bottom: 20px;" />
</div>
```

---

## Complete Email Structure (With Logo)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Harthio</title>
  <style>
    /* Email styles */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <!-- LOGO HERE -->
      <img src="https://harthio.com/logo.svg" alt="Harthio" style="height: 40px; margin-bottom: 20px;" />
      
      <!-- HEADING -->
      <h1>👋 Welcome to Harthio!</h1>
      <p>We're excited to have you here</p>
    </div>
    
    <div class="content">
      <!-- PERSONALIZED GREETING -->
      <p>Hi {{firstName}},</p>
      
      <!-- EMAIL CONTENT -->
      <p>Content here...</p>
      
      <!-- DYNAMIC SIGNATURE -->
      <p>Best,<br><strong>Tosin</strong><br>Founder, Harthio</p>
    </div>
    
    <div class="footer">
      <p><a href="{{appUrl}}">Visit Harthio</a> • <a href="{{appUrl}}/unsubscribe?token={{unsubscribeToken}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
```

---

## Variables Available in Templates

| Variable | Example Value | Fallback |
|----------|---------------|----------|
| `{{firstName}}` | "Sarah" | "there" |
| `{{appUrl}}` | "https://harthio.com" | - |
| `{{unsubscribeToken}}` | User ID | - |

### Adding More Variables (Future):

**In `email-campaign-service.ts`:**
```typescript
const variables = {
  firstName: user.first_name || user.display_name || 'there',
  lastName: user.last_name || '',
  fullName: `${user.first_name} ${user.last_name}`.trim() || user.display_name,
  email: user.email,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://harthio.com',
  unsubscribeToken: user.id
};
```

**Then use in templates:**
```html
<p>Hi {{firstName}} {{lastName}},</p>
<p>Your email: {{email}}</p>
```

---

## Testing Checklist

### Test Personalization:
- [ ] Check your user has `first_name` in database
- [ ] Send test campaign to yourself
- [ ] Verify email shows YOUR name, not "John"
- [ ] Test with user who has no name (should show "Hi there")

### Test Logo:
- [ ] Run SQL update script
- [ ] Send test email
- [ ] Verify logo appears in email
- [ ] Check logo loads on mobile
- [ ] Test in Gmail, Outlook, Apple Mail

---

## Common Issues & Solutions

### Issue: Email shows "Hi there" for everyone
**Cause:** Users don't have `first_name` in database
**Solution:** 
```sql
-- Check user names
SELECT email, first_name, display_name FROM users LIMIT 10;

-- Update missing names (if needed)
UPDATE users 
SET first_name = 'FirstName' 
WHERE email = 'user@example.com';
```

### Issue: Logo doesn't show
**Cause:** Logo file not accessible
**Solutions:**
1. Check file exists: `public/logo.svg`
2. Test URL: https://harthio.com/logo.svg
3. Use absolute URL with CDN
4. Use PNG instead of SVG

### Issue: Logo too big/small
**Solution:** Adjust height in style:
```html
<!-- Small -->
style="height: 30px;"

<!-- Medium -->
style="height: 50px;"

<!-- Large -->
style="height: 80px;"
```

### Issue: Preview still shows "John"
**This is correct!** Preview always shows sample data.
Real emails will show actual user names.

---

## Deployment Steps

### 1. Add Logo to Templates
```bash
# In Supabase SQL Editor
# Run: database/add-logo-to-email-templates.sql
```

### 2. Verify Logo URL Works
```bash
# Test in browser
https://harthio.com/logo.svg
```

### 3. Send Test Email
```bash
# In admin panel
1. Select any template
2. Preview (will show "John" - that's OK!)
3. Send to yourself
4. Check inbox - should show YOUR name and logo
```

### 4. Verify in Production
- [ ] Logo appears
- [ ] Your name appears (not "John")
- [ ] Logo loads on mobile
- [ ] All links work

---

## Summary

### ✅ Personalization:
- **Preview:** Shows "Hi John" (sample data)
- **Real emails:** Show actual user names
- **Fallback:** "Hi there" if no name
- **Working correctly!**

### ✅ Logo:
- **File:** `public/logo.svg`
- **URL:** `https://harthio.com/logo.svg`
- **Add to templates:** Run SQL script
- **Size:** 40px height (adjustable)

### 🎯 Next Steps:
1. Run `add-logo-to-email-templates.sql`
2. Send test email to yourself
3. Verify YOUR name appears (not "John")
4. Verify logo appears
5. Deploy!

---

## Files Created:
- `database/add-logo-to-email-templates.sql` - Adds logo to all templates
- `EMAIL_PERSONALIZATION_AND_LOGO.md` - This guide

**Everything is working correctly! The "Hi John" is just preview sample data. Real emails will use actual user names.** 🎉
