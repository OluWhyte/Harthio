-- ============================================================================
-- ADD CUSTOM BLANK EMAIL TEMPLATE
-- ============================================================================
-- Adds a blank template for custom email content

INSERT INTO email_templates (name, subject, html_content, text_content, description, category, variables) VALUES
(
  'Custom Email (Blank)',
  'Your Subject Here',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email from Harthio</title>
  <style>
    body { font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: hsl(240, 67%, 94%); }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .content { padding: 40px 30px; }
    .footer { background: hsl(240, 20%, 96%); padding: 20px; text-align: center; font-size: 12px; color: hsl(240, 10%, 40%); border-top: 1px solid hsl(240, 20%, 90%); }
    .footer a { color: hsl(340, 82%, 52%); text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <!-- Write your custom email content here -->
      <p>Your custom email content goes here.</p>
      
      <p>You can use these variables:</p>
      <ul>
        <li>{{firstName}} - User''s first name</li>
        <li>{{email}} - User''s email</li>
        <li>{{appUrl}} - Link to Harthio</li>
      </ul>
    </div>
    <div class="footer">
      <p>
        <a href="{{appUrl}}">Harthio</a> | 
        <a href="{{appUrl}}/unsubscribe?token={{unsubscribeToken}}">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>',
  'Your custom email content goes here.

You can use these variables:
- {{firstName}} - User''s first name
- {{email}} - User''s email
- {{appUrl}} - Link to Harthio

---
Harthio | Unsubscribe: {{appUrl}}/unsubscribe?token={{unsubscribeToken}}',
  'A blank template for writing custom email campaigns. Includes basic styling and unsubscribe link.',
  'custom',
  '["firstName", "email", "appUrl", "unsubscribeToken"]'::jsonb
);
