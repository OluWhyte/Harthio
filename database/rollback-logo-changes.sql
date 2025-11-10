-- ============================================================================
-- ROLLBACK LOGO CHANGES
-- ============================================================================
-- This script removes the logo additions if they broke the templates

-- Check current state
SELECT 
  name,
  LENGTH(html_content) as content_length,
  CASE 
    WHEN html_content LIKE '%<img src="https://harthio.com/logo.svg"%' THEN '✅ Logo present'
    ELSE '❌ No logo'
  END as logo_status
FROM email_templates
ORDER BY name;

-- Remove logo from all templates (if it was added)
UPDATE email_templates
SET html_content = REPLACE(
  html_content,
  '<img src="https://harthio.com/logo.svg" alt="Harthio" style="height: 40px; margin-bottom: 20px;" />
      ',
  ''
)
WHERE html_content LIKE '%<img src="https://harthio.com/logo.svg"%';

-- Verify removal
SELECT 
  name,
  CASE 
    WHEN html_content LIKE '%<img src="https://harthio.com/logo.svg"%' THEN '❌ Logo still present'
    ELSE '✅ Logo removed'
  END as logo_status
FROM email_templates
ORDER BY name;

-- If templates are completely broken, you may need to re-run the original schema
-- File: database/email-campaigns-schema.sql
-- This will recreate all 4 templates from scratch
