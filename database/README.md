# Database Directory

This directory contains database-related files organized by purpose.

## Structure

### `/migrations/`
- Production database schema files
- Migration scripts for database updates
- Files: `blog-schema.sql`, `combined.sql`, `device-tracking-schema.sql`

### `/setup/` (Not in Git)
- Initial setup scripts for new environments
- Admin user creation scripts
- Contains sensitive configuration
- Files: `setup-admin.sql`

### `/debug/` (Not in Git)
- Debug and troubleshooting SQL scripts
- Quick fixes and patches
- Development-only scripts
- Files: `debug-admin.sql`, `fix-admin-rls.sql`, `quick-admin-fix.sql`

## Security Notes

- `/setup/` and `/debug/` directories are excluded from version control
- These may contain sensitive information like admin emails or debug data
- Always review scripts before running in production
- Keep local copies for development use only

## Usage

1. **For new deployments**: Use files in `/migrations/` for schema setup
2. **For admin setup**: Use scripts in `/setup/` (create locally)
3. **For debugging**: Use scripts in `/debug/` (development only)