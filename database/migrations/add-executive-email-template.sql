-- ============================================================================
-- ADD EXECUTIVE EMAIL TEMPLATE (No Unsubscribe)
-- ============================================================================
-- Adds a blank template for executive/personal emails without unsubscribe link

INSERT INTO email_templates (name, subject, html_content, text_content, description, category, variables) VALUES
(
  'Executive Email (No Unsubscribe)',
  'Your Subject Here',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email from Harthio</title>
  <style>
    body { font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .content { padding: 40px 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <!-- Write your custom email content here -->
      <p>Your custom email content goes here.</p>
      
      <p>You can use these variables:</p>
      <ul>
        <li>{{recipientName}} - Recipient''s name (you provide this)</li>
        <li>{{email}} - Recipient''s email</li>
        <li>{{appUrl}} - Link to Harthio</li>
      </ul>
    </div>
  </div>
</body>
</html>',
  'Your custom email content goes here.

You can use these variables:
- {{recipientName}} - Recipient''s name (you provide this)
- {{email}} - Recipient''s email
- {{appUrl}} - Link to Harthio',
  'A blank template for executive/personal emails. No unsubscribe link. Use for investors, partners, or personal outreach.',
  'executive',
  '["recipientName", "email", "appUrl"]'::jsonb
);
