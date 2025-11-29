-- Enable pg_cron extension for scheduled jobs
-- This must be run first before creating the archive migration

-- Enable the extension (requires superuser/admin)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Verify it's enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
