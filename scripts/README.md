# Scripts Directory

This directory contains development and administrative scripts.

## Structure

### `/admin/`
- Administrative scripts and utilities
- Server management tools
- Deployment helpers

### `/debug/` (Not in Git)
- Debug pages and development tools
- Testing utilities
- Development-only components
- Contains: `debug-admin/`, `debug-auth/`, `debug-media/`

## Security Notes

- `/debug/` directory is excluded from version control
- Debug pages may expose sensitive information
- Never deploy debug scripts to production
- Keep for local development only

## Usage

- Debug pages can be accessed locally for development
- Admin scripts should be run with appropriate permissions
- Always test scripts in development before production use