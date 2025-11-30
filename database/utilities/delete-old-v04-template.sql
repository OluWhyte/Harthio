-- ============================================================================
-- DELETE OLD V0.4 ANNOUNCEMENT TEMPLATE AND CAMPAIGNS
-- ============================================================================
-- Removes the incorrect V0.4 template and any campaigns using it

-- Step 1: Find campaigns using the V0.4 template
SELECT 
  c.id,
  c.name,
  c.status,
  c.created_at
FROM email_campaigns c
JOIN email_templates t ON c.template_id = t.id
WHERE t.name = 'New Features Announcement V0.4';

-- Step 2: Delete campaigns using the V0.4 template
DELETE FROM email_campaigns
WHERE template_id IN (
  SELECT id FROM email_templates 
  WHERE name = 'New Features Announcement V0.4'
);

-- Step 3: Delete the old V0.4 template
DELETE FROM email_templates 
WHERE name = 'New Features Announcement V0.4';

-- Step 4: Verify deletion
SELECT 
  name,
  category,
  description
FROM email_templates
WHERE category = 'announcement'
ORDER BY name;

-- If you see no results, the old template was successfully deleted
-- Now you can run: database/migrations/add-new-features-announcement-email.sql
