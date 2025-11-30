-- ============================================================================
-- ADD NEW FEATURES ANNOUNCEMENT EMAIL TEMPLATE
-- ============================================================================
-- Email to announce V0.4 features to existing users

INSERT INTO email_templates (name, subject, html_content, text_content, description, category, variables) VALUES
(
  'New Features Announcement V0.4',
  '🚀 Exciting New Features on Harthio!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Features on Harthio</title>
  <style>
    body { font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: hsl(240, 67%, 94%); }
    .container { max-width: 600px; margin: 0; auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, hsl(340, 82%, 52%) 0%, hsl(180, 100%, 25%) 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 40px 30px; }
    .feature-box { background: hsl(240, 67%, 97%); border-left: 4px solid hsl(340, 82%, 52%); padding: 20px; margin: 20px 0; border-radius: 8px; }
    .feature-box h3 { margin-top: 0; color: hsl(340, 82%, 52%); }
    .button { display: inline-block; background: hsl(340, 82%, 52%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: all 0.2s ease; }
    .button:hover { background: hsl(340, 82%, 47%); transform: translateY(-1px); }
    .footer { background: hsl(240, 20%, 96%); padding: 30px 20px; text-align: center; font-size: 14px; color: hsl(240, 10%, 40%); }
    .footer a { color: hsl(340, 82%, 52%); text-decoration: none; }
    .emoji { font-size: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Exciting Updates!</h1>
      <p>We''ve been busy building new features for you</p>
    </div>
    <div class="content">
      <p>Hi {{firstName}},</p>
      
      <p>I''m excited to share some major updates we''ve made to Harthio based on your feedback!</p>
      
      <p>Here''s what''s new:</p>
      
      <div class="feature-box">
        <h3><span class="emoji">🤖</span> AI Companion - Your 24/7 Support</h3>
        <p>Need someone to talk to at 2am? Our AI Companion is here for you with:</p>
        <ul>
          <li>Evidence-based CBT tools</li>
          <li>Crisis detection and support</li>
          <li>Always available, always understanding</li>
        </ul>
        <p><strong>Free to use:</strong> 3 AI messages per day</p>
      </div>
      
      <div class="feature-box">
        <h3><span class="emoji">📊</span> Recovery Tracker - Visualize Your Journey</h3>
        <p>Track your sobriety and recovery milestones with:</p>
        <ul>
          <li>Real-time progress tracking</li>
          <li>Visual journey timeline</li>
          <li>Milestone celebrations</li>
          <li>Multiple tracker support</li>
        </ul>
        <p><strong>Perfect for:</strong> Sobriety, habits, goals, and personal growth</p>
      </div>
      
      <div class="feature-box">
        <h3><span class="emoji">💬</span> Enhanced Video Sessions</h3>
        <p>Better than ever with:</p>
        <ul>
          <li>Improved video quality</li>
          <li>Real-time chat during calls</li>
          <li>Mobile-optimized interface</li>
          <li>Session quality analytics</li>
        </ul>
      </div>
      
      <div class="feature-box">
        <h3><span class="emoji">✅</span> Daily Check-ins</h3>
        <p>Stay accountable with:</p>
        <ul>
          <li>Quick daily mood tracking</li>
          <li>Progress insights</li>
          <li>Streak tracking</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{appUrl}}/dashboard" class="button">Explore New Features</a>
      </div>
      
      <p><strong>What''s Next?</strong></p>
      <p>We''re constantly improving based on your feedback. If you have ideas or suggestions, just reply to this email - I read every message.</p>
      
      <p>Thank you for being part of the Harthio community. Your support means everything as we build a platform where no one has to face their struggles alone.</p>
      
      <p>With gratitude,<br><strong>Seyi</strong><br>Founder, Harthio</p>
      
      <p style="font-size: 14px; color: #666; margin-top: 30px;">P.S. - All these features are free to use. We''re committed to making meaningful support accessible to everyone.</p>
    </div>
    <div class="footer">
      <p>This email was sent by Harthio - Platform for meaningful conversations</p>
      <p><a href="{{appUrl}}">Visit Harthio</a> • <a href="{{appUrl}}/unsubscribe?token={{unsubscribeToken}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>',
  'Hi {{firstName}},

I''m excited to share some major updates we''ve made to Harthio based on your feedback!

Here''s what''s new:

🤖 AI COMPANION - Your 24/7 Support
Need someone to talk to at 2am? Our AI Companion is here for you with:
- Evidence-based CBT tools
- Crisis detection and support
- Always available, always understanding
Free to use: 3 AI messages per day

📊 RECOVERY TRACKER - Visualize Your Journey
Track your sobriety and recovery milestones with:
- Real-time progress tracking
- Visual journey timeline
- Milestone celebrations
- Multiple tracker support
Perfect for: Sobriety, habits, goals, and personal growth

💬 ENHANCED VIDEO SESSIONS
Better than ever with:
- Improved video quality
- Real-time chat during calls
- Mobile-optimized interface
- Session quality analytics

✅ DAILY CHECK-INS
Stay accountable with:
- Quick daily mood tracking
- Progress insights
- Streak tracking

Explore New Features: {{appUrl}}/dashboard

WHAT''S NEXT?
We''re constantly improving based on your feedback. If you have ideas or suggestions, just reply to this email - I read every message.

Thank you for being part of the Harthio community. Your support means everything as we build a platform where no one has to face their struggles alone.

With gratitude,
Seyi
Founder, Harthio

P.S. - All these features are free to use. We''re committed to making meaningful support accessible to everyone.

---
Visit Harthio: {{appUrl}}
Unsubscribe: {{appUrl}}/unsubscribe?token={{unsubscribeToken}}',
  'Announcement email for V0.4 new features - sent to all existing users',
  'announcement',
  '["firstName", "appUrl", "unsubscribeToken"]'::jsonb
);

-- Verify template was created
SELECT 
  name,
  subject,
  category,
  description,
  '✅ Created' as status
FROM email_templates
WHERE name = 'New Features Announcement V0.4';

