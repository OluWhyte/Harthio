-- ============================================================================
-- MANUAL PRODUCTION BACKUP (Free Tier Workaround)
-- ============================================================================
-- Run this in PRODUCTION Supabase SQL Editor BEFORE running migrations
-- This exports critical data that we can restore if needed

-- Backup users table
CREATE TABLE IF NOT EXISTS users_backup_20251202 AS 
SELECT * FROM users;

-- Backup topics table
CREATE TABLE IF NOT EXISTS topics_backup_20251202 AS 
SELECT * FROM topics;

-- Backup messages table
CREATE TABLE IF NOT EXISTS messages_backup_20251202 AS 
SELECT * FROM messages;

-- Backup admin_roles table
CREATE TABLE IF NOT EXISTS admin_roles_backup_20251202 AS 
SELECT * FROM admin_roles;

-- Backup email_templates table (if exists)
CREATE TABLE IF NOT EXISTS email_templates_backup_20251202 AS 
SELECT * FROM email_templates;

-- Backup email_campaigns table (if exists)
CREATE TABLE IF NOT EXISTS email_campaigns_backup_20251202 AS 
SELECT * FROM email_campaigns;

-- Verify backups created
SELECT 
  'users_backup_20251202' as table_name,
  COUNT(*) as row_count
FROM users_backup_20251202
UNION ALL
SELECT 
  'topics_backup_20251202',
  COUNT(*)
FROM topics_backup_20251202
UNION ALL
SELECT 
  'messages_backup_20251202',
  COUNT(*)
FROM messages_backup_20251202
UNION ALL
SELECT 
  'admin_roles_backup_20251202',
  COUNT(*)
FROM admin_roles_backup_20251202;

-- Success message
SELECT '✅ Backup complete! Safe to proceed with migrations.' as status;
