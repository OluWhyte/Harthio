# Database Migrations

## Active Migrations (Run These)

### Core v0.3 Schema
1. **combined.sql** - Base schema (users, sessions, topics, messages, join_requests)
2. **daily-checkins.sql** - Daily check-in system
3. **sobriety-trackers.sql** - Sobriety milestone tracking
4. **visual-journey-complete.sql** - Visual progress with photos
5. **fix-topics-and-rpc.sql** - Adds updated_at column to topics
6. **admin-roles.sql** - Admin access control (NEW - for dev setup)

### v0.4 Features
7. **add-tier-system.sql** - Freemium tier system
8. **add-tier-admin-policies.sql** - Admin policies for tiers
9. **add-ai-chat-history.sql** - AI chat persistence
10. **add-ai-feedback.sql** - AI feedback system

### Production Upgrades
- **add-permissions-to-admin-roles.sql** - Upgrade existing admin_roles table (run on production only)

## Setup Order

### New Dev Database
```sql
-- Run in this exact order:
1. combined.sql
2. daily-checkins.sql
3. sobriety-trackers.sql
4. visual-journey-complete.sql
5. fix-topics-and-rpc.sql
6. admin-roles.sql
7. add-tier-system.sql
8. add-tier-admin-policies.sql
9. add-ai-chat-history.sql
10. add-ai-feedback.sql
```

### Existing Production Database
```sql
-- Only run what's missing:
- add-permissions-to-admin-roles.sql (if admin_roles exists but lacks permissions column)
- add-tier-system.sql (if not already run)
- add-tier-admin-policies.sql (if not already run)
- add-ai-chat-history.sql (if not already run)
- add-ai-feedback.sql (if not already run)
```

## Archive
Old/unused migrations moved to `archive/` folder for reference.
