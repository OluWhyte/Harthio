# Database Directory

Clean, organized database files for Harthio.

## Structure

### `/migrations/`
All schema migrations - see `migrations/README.md` for setup order
- Core v0.3 schema (combined, daily-checkins, sobriety-trackers, visual-journey, etc.)
- v0.4 features (tier system, AI chat, AI feedback)
- Admin system (admin-roles)

### `/utilities/`
Helper scripts for checking and debugging:
- `check-*.sql` - Query scripts to verify table data
- `get-production-*.sql` - Scripts to extract production schema
- `clear-test-user-data.sql` - Clean up test data

### `/setup/`
Initial setup scripts:
- `setup-admin.sql` - Create admin users

### `/monitoring/`
Health checks and monitoring queries

### `/security-fixes/`
Security-related database updates

### `/archive/`
Old/unused files kept for reference

## Quick Start

**New Database Setup:**
1. See `migrations/README.md` for exact order
2. Run migrations 1-10 in sequence
3. Use `setup/setup-admin.sql` to create admin users

**Production Upgrade:**
Only run new migrations you haven't applied yet
