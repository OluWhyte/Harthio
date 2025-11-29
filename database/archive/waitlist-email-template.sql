-- ============================================================================
-- WAITLIST EMAIL TEMPLATE
-- ============================================================================
-- Email template for waitlist users (use with custom email list)

INSERT INTO email_templates (name, subject, html_content, text_content, description, category, variables) VALUES
(
  'Waitlist Welcome',
  'Harthio is live - Join the conversation! 🎉',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harthio is Live!</title>
  <style>
    body { font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: hsl(240, 67%, 94%); }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, hsl(340, 82%, 52%) 0%, hsl(180, 100%, 25%) 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: hsl(340, 82%, 52%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: all 0.2s ease; }
    .button:hover { background: hsl(340, 82%, 47%); transform: translateY(-1px); }
    .highlight-box { background: hsl(340, 82%, 97%); border-left: 4px solid hsl(340, 82%, 52%); padding: 20px; margin: 20px 0; border-radius: 8px; }
    .session-example { background: hsl(240, 20%, 98%); padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 3px solid hsl(180, 100%, 25%); }
    .footer { background: hsl(240, 20%, 96%); padding: 30px 20px; text-align: center; font-size: 14px; color: hsl(240, 10%, 40%); }
    .footer a { color: hsl(340, 82%, 52%); text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Harthio is Live!</h1>
      <p>Your invitation to meaningful conversations</p>
    </div>
    <div class="content">
      <p>Hi {{firstName}},</p>
      
      <p>Great news - Harthio is officially live and ready for you!</p>
      
      <p>We launched in October and just rolled out our latest version with even better features. The platform is growing, and we''d love to have you join the community.</p>
      
      <p><strong>What is Harthio?</strong></p>
      <p>Harthio is where you schedule video/voice conversations with people who share your interests. No random connections, no small talk - just meaningful conversations about topics you actually care about.</p>
      
      <div class="highlight-box">
        <p><strong>💡 Real sessions happening on Harthio:</strong></p>
        <div class="session-example">
          <strong>👩‍👧 "Navigating Single Motherhood"</strong><br>
          <span style="font-size: 14px; color: #666;">A recently divorced mom looking to connect with someone who understands the journey</span>
        </div>
        <div class="session-example">
          <strong>💻 "My First SaaS Launch"</strong><br>
          <span style="font-size: 14px; color: #666;">A founder wanting to talk through their startup journey with another entrepreneur</span>
        </div>
        <div class="session-example">
          <strong>🧠 "Life After 30: Finding Purpose"</strong><br>
          <span style="font-size: 14px; color: #666;">Someone exploring big questions about meaning and direction in life</span>
        </div>
      </div>
      
      <p><strong>Here''s how it works:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Create a session about any topic you''re passionate about</li>
        <li>Set a time that works for you</li>
        <li>People who resonate with your topic request to join</li>
        <li>Have real conversations via video/voice chat</li>
        <li>Build genuine connections with people who "get it"</li>
      </ul>
      
      <p><strong>What could you host a session about?</strong></p>
      <p>Tech trends? Personal growth? Creative projects? Career transitions? Mental health? Philosophy? Gaming? Anything that matters to you - there are people who want to talk about it too.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{appUrl}}/signup" class="button">Join Harthio Now</a>
      </div>
      
      <p>Your voice matters. Your experiences matter. And there are people waiting to have these conversations with you.</p>
      
      <p>Ready to host your first session?</p>
      
      <p>Best,<br><strong>Tosin</strong><br>Co-founder, Harthio</p>
      
      <p style="font-size: 14px; color: #666; margin-top: 30px;"><em>P.S. - We''re still in early stages, actively improving based on user feedback. Your input will directly shape how Harthio evolves. Join us!</em></p>
    </div>
    <div class="footer">
      <p>This email was sent by Harthio - Platform for meaningful conversations</p>
      <p><a href="{{appUrl}}">Visit Harthio</a> • <a href="{{appUrl}}/unsubscribe?token={{unsubscribeToken}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>',
  'Hi {{firstName}},

Great news - Harthio is officially live and ready for you!

We launched in October and just rolled out our latest version with even better features. The platform is growing, and we''d love to have you join the community.

What is Harthio?
Harthio is where you schedule video/voice conversations with people who share your interests. No random connections, no small talk - just meaningful conversations about topics you actually care about.

💡 Real sessions happening on Harthio:

👩‍👧 "Navigating Single Motherhood"
A recently divorced mom looking to connect with someone who understands the journey

💻 "My First SaaS Launch"
A founder wanting to talk through their startup journey with another entrepreneur

🧠 "Life After 30: Finding Purpose"
Someone exploring big questions about meaning and direction in life

Here''s how it works:
- Create a session about any topic you''re passionate about
- Set a time that works for you
- People who resonate with your topic request to join
- Have real conversations via video/voice chat
- Build genuine connections with people who "get it"

What could you host a session about?
Tech trends? Personal growth? Creative projects? Career transitions? Mental health? Philosophy? Gaming? Anything that matters to you - there are people who want to talk about it too.

Join Harthio Now: {{appUrl}}/signup

Your voice matters. Your experiences matter. And there are people waiting to have these conversations with you.

Ready to host your first session?

Best,
Tosin
Co-founder, Harthio

P.S. - We''re still in early stages, actively improving based on user feedback. Your input will directly shape how Harthio evolves. Join us!

---
Visit Harthio: {{appUrl}}
Unsubscribe: {{appUrl}}/unsubscribe?token={{unsubscribeToken}}',
  'Welcome email for waitlist users - platform is live, encouraging them to join and host sessions',
  'waitlist',
  '["firstName", "appUrl", "unsubscribeToken"]'::jsonb
);

-- Verify the template was created
SELECT 
  name,
  subject,
  category,
  description,
  '✅ Created' as status
FROM email_templates
WHERE name = 'Waitlist Welcome';
