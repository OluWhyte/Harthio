# Email Campaigns - Migration from Old to New Admin

## Overview
The email campaigns page allows admins to send targeted email campaigns to users based on various filters. This is a critical feature for user engagement and communication.

## Old Email Campaigns Page Features

### 1. Email Templates
- Stored in `email_templates` database table
- Each template has:
  - Name, subject, HTML content, text content
  - Description and category
  - Variables (e.g., {{firstName}}, {{appUrl}})
- Templates are reusable across campaigns

### 2. Audience Filters (User Segmentation)

#### Test Users
- **test_users**: 3 safe test accounts for testing emails
  - peterlimited2000@gmail.com
  - whytecleaners@gmail.com
  - xcrowme@gmail.com

#### Time-Based Filters (Precise Date Ranges)
- **new_users_24h**: Users created in last 24 hours
- **new_users_1_3d**: Users created 1-3 days ago
- **new_users_3_7d**: Users created 3-7 days ago
- **new_users_7_30d**: Users created 7-30 days ago
- **new_users_30plus**: Users created 30+ days ago

#### Activity-Based Filters
- **active_users**: Users active in last 30 days
- **inactive_users**: Users inactive for 30+ days
- **all**: All users in database

#### Custom Email List
- **custom**: Paste comma or newline-separated emails
- Bypasses unsubscribe preferences
- Validates email format

### 3. Campaign Creation Features

#### Form Fields
- **Template Selection**: Dropdown of available templates
- **Audience Filter**: Select target user segment
- **From Email**: Choose sender (tosin@, seyi@, no-reply@)
- **Custom Subject**: Optional override of template subject
- **Custom Emails**: Textarea for custom email list

#### Actions
- **Preview**: See how email looks with sample data
- **Export Audience**: Download CSV of target users
- **Send Campaign**: Create and send campaign

### 4. Campaign History

#### Filters
- Filter by template
- Filter by audience type
- Filter by status (draft/scheduled/sending/sent/failed)
- Filter by date range (from/to)
- Clear all filters button

#### Campaign Display
- Campaign name, from email, subject
- Template and audience badges
- Status badge (color-coded)
- Metrics: Total recipients, sent count, failed count
- Created date
- Export recipients button
- Delete campaign button

### 5. Export Functionality

#### Export Audience (Before Sending)
- Downloads CSV of target users
- Includes: Email, First Name, Last Name, Display Name, Created At, Unsubscribed
- Filename: `harthio-audience-{filter}-{date}.csv`

#### Export Campaign Recipients (After Sending)
- Downloads CSV of actual recipients
- Includes: Email, Status, Sent At, Error Message
- Filename: `harthio-campaign-{name}-recipients-{date}.csv`

### 6. Email Service Integration

#### Database Tables
- `email_templates`: Template storage
- `email_campaigns`: Campaign records
- `email_campaign_recipients`: Individual send records
- `users`: User data with unsubscribe flags

#### Service Methods (email-campaign-service.ts)
- `getTemplates()`: Fetch all templates
- `getTemplate(id)`: Fetch single template
- `getAudienceCount(filter, customEmails)`: Count target users
- `getAudienceUsers(filter, customEmails)`: Fetch target users
- `createCampaign(data)`: Create campaign record
- `sendCampaign(id, customEmails)`: Send emails to audience
- `getCampaigns()`: Fetch campaign history
- `getCampaignRecipients(id)`: Fetch recipient records
- `deleteCampaign(id)`: Delete campaign

### 7. Email Sending Logic
- Respects unsubscribe preferences (except custom emails)
- Tracks individual send status
- Records errors for failed sends
- Updates campaign statistics
- Uses Resend API for actual sending

## Migration to Admin V2

### What to Keep
1. All audience filter options
2. Template selection system
3. Preview functionality
4. Export capabilities (audience + recipients)
5. Campaign history with filters
6. Custom email list feature
7. From email selection
8. Custom subject override

### What to Improve
1. Better UI/UX with modern design
2. Real-time audience count updates
3. Better error handling and feedback
4. Improved mobile responsiveness
5. Better campaign status visualization
6. Inline template preview
7. Batch operations on campaigns

### Required Components
- Email template selector
- Audience filter dropdown
- Custom email textarea with validation
- Preview dialog
- Confirm send dialog
- Campaign history table with filters
- Export buttons (CSV)

### Required Services
- email-campaign-service.ts (already exists)
- email-service.ts (for actual sending)

## Implementation Notes

### Audience Filter Logic
```typescript
// Date calculations
const now = new Date();
const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

// Apply to Supabase query
query.gte('created_at', oneDayAgo.toISOString())
```

### Custom Email Parsing
```typescript
const emails = value
  .split(/[,\n]/)
  .map(e => e.trim())
  .filter(e => e && e.includes('@'));
```

### Template Variable Replacement
```typescript
let html = template.html_content;
html = html.replace(/{{firstName}}/g, user.first_name);
html = html.replace(/{{appUrl}}/g, process.env.NEXT_PUBLIC_APP_URL);
html = html.replace(/{{unsubscribeToken}}/g, user.unsubscribe_token);
```

## Status
- ✅ Old page analyzed
- ✅ Features documented
- ✅ Audience filters documented
- ⏳ New page to be created
- ⏳ Testing required
