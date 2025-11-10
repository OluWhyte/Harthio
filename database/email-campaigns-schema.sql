-- ============================================================================
-- EMAIL CAMPAIGNS SCHEMA
-- ============================================================================
-- Tables for managing email campaigns and tracking

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general', -- 'onboarding', 'engagement', 're-engagement', 'announcement'
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names used in template
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Campaigns Table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  from_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  audience_filter VARCHAR(50) NOT NULL, -- 'all', 'new_users', 'inactive_users', 'active_users'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed'
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Campaign Sends Table (tracking individual sends)
CREATE TABLE IF NOT EXISTS email_campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Email Preferences Table
CREATE TABLE IF NOT EXISTS user_email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  unsubscribed_marketing BOOLEAN DEFAULT FALSE,
  unsubscribed_all BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_campaign_sends_campaign_id ON email_campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_sends_user_id ON email_campaign_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_sends_status ON email_campaign_sends(status);
CREATE INDEX IF NOT EXISTS idx_user_email_preferences_user_id ON user_email_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only access)
CREATE POLICY "Admin can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE admin_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage email campaigns" ON email_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE admin_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view campaign sends" ON email_campaign_sends
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE admin_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own email preferences" ON user_email_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own email preferences" ON user_email_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, description, category, variables) VALUES
(
  'Welcome Email',
  'Welcome to Harthio - What would you like to talk about?',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Harthio</title>
  <style>
    body { font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: hsl(240, 67%, 94%); }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, hsl(340, 82%, 52%) 0%, hsl(180, 100%, 25%) 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: hsl(340, 82%, 52%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: all 0.2s ease; }
    .button:hover { background: hsl(340, 82%, 47%); transform: translateY(-1px); }
    .footer { background: hsl(240, 20%, 96%); padding: 30px 20px; text-align: center; font-size: 14px; color: hsl(240, 10%, 40%); }
    .footer a { color: hsl(340, 82%, 52%); text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>👋 Welcome to Harthio!</h1>
      <p>We''re excited to have you here</p>
    </div>
    <div class="content">
      <p>Hi {{firstName}},</p>
      
      <p>I''m Tosin, founder of Harthio. I wanted to personally welcome you to our platform for meaningful conversations.</p>
      
      <p><strong>Quick question:</strong> What topics would you like to talk about?</p>
      
      <p>Whether it''s tech, philosophy, personal growth, or anything else - Harthio is your space to connect with people who truly get it.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{appUrl}}/dashboard" class="button">Create Your First Session</a>
      </div>
      
      <p>Need help getting started? Just reply to this email - I read every message.</p>
      
      <p>Looking forward to seeing what conversations you start!</p>
      
      <p>Best,<br><strong>Tosin</strong><br>Founder, Harthio</p>
    </div>
    <div class="footer">
      <p>This email was sent by Harthio - Platform for meaningful conversations</p>
      <p><a href="{{appUrl}}">Visit Harthio</a> • <a href="{{appUrl}}/unsubscribe?token={{unsubscribeToken}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>',
  'Hi {{firstName}},

I''m Tosin, founder of Harthio. I wanted to personally welcome you to our platform for meaningful conversations.

Quick question: What topics would you like to talk about?

Whether it''s tech, philosophy, personal growth, or anything else - Harthio is your space to connect with people who truly get it.

Create Your First Session: {{appUrl}}/dashboard

Need help getting started? Just reply to this email - I read every message.

Looking forward to seeing what conversations you start!

Best,
Tosin
Founder, Harthio

---
Visit Harthio: {{appUrl}}
Unsubscribe: {{appUrl}}/unsubscribe?token={{unsubscribeToken}}',
  'Welcome email sent immediately after signup',
  'onboarding',
  '["firstName", "appUrl", "unsubscribeToken"]'::jsonb
),
(
  'Day 3 Follow-up',
  'How''s your Harthio experience going?',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How''s it going?</title>
  <style>
    body { font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: hsl(240, 67%, 94%); }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, hsl(180, 100%, 25%) 0%, hsl(340, 82%, 52%) 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: hsl(180, 100%, 25%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .tip-box { background: hsl(180, 100%, 97%); border-left: 4px solid hsl(180, 100%, 25%); padding: 20px; margin: 20px 0; border-radius: 8px; }
    .footer { background: hsl(240, 20%, 96%); padding: 30px 20px; text-align: center; font-size: 14px; color: hsl(240, 10%, 40%); }
    .footer a { color: hsl(340, 82%, 52%); text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💬 How''s it going?</h1>
    </div>
    <div class="content">
      <p>Hi {{firstName}},</p>
      
      <p>It''s been a few days since you joined Harthio. I wanted to check in and see how things are going.</p>
      
      <p>Have you had a chance to explore the platform? Found any interesting conversations?</p>
      
      <div class="tip-box">
        <p><strong>💡 Quick Tip:</strong> The best way to get started is to create a session about something you''re passionate about. You''d be surprised how many people want to talk about the same things!</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{appUrl}}/dashboard" class="button">Browse Sessions</a>
      </div>
      
      <p>If you''re stuck or have questions, just hit reply. I''m here to help!</p>
      
      <p>Cheers,<br><strong>Tosin</strong></p>
    </div>
    <div class="footer">
      <p><a href="{{appUrl}}">Visit Harthio</a> • <a href="{{appUrl}}/unsubscribe?token={{unsubscribeToken}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>',
  'Hi {{firstName}},

It''s been a few days since you joined Harthio. I wanted to check in and see how things are going.

Have you had a chance to explore the platform? Found any interesting conversations?

💡 Quick Tip: The best way to get started is to create a session about something you''re passionate about. You''d be surprised how many people want to talk about the same things!

Browse Sessions: {{appUrl}}/dashboard

If you''re stuck or have questions, just hit reply. I''m here to help!

Cheers,
Tosin

---
Visit Harthio: {{appUrl}}
Unsubscribe: {{appUrl}}/unsubscribe?token={{unsubscribeToken}}',
  'Follow-up email sent 3 days after signup if no session created',
  'onboarding',
  '["firstName", "appUrl", "unsubscribeToken"]'::jsonb
),
(
  'Week 1 Check-in',
  'Your first week on Harthio',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Week 1 Check-in</title>
  <style>
    body { font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: hsl(240, 67%, 94%); }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, hsl(340, 82%, 52%) 0%, hsl(180, 100%, 25%) 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: hsl(340, 82%, 52%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background: hsl(240, 20%, 96%); padding: 30px 20px; text-align: center; font-size: 14px; color: hsl(240, 10%, 40%); }
    .footer a { color: hsl(340, 82%, 52%); text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 One week in!</h1>
    </div>
    <div class="content">
      <p>Hi {{firstName}},</p>
      
      <p>You''ve been on Harthio for a week now. How''s your experience been?</p>
      
      <p>I''d love to hear your thoughts:</p>
      <ul>
        <li>What do you like most about Harthio?</li>
        <li>What could be better?</li>
        <li>What features would you like to see?</li>
      </ul>
      
      <p>Your feedback helps shape the future of Harthio. Just reply to this email - I read every response.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{appUrl}}/dashboard" class="button">Continue Your Journey</a>
      </div>
      
      <p>Thanks for being part of our community!</p>
      
      <p>Best,<br><strong>Tosin</strong></p>
    </div>
    <div class="footer">
      <p><a href="{{appUrl}}">Visit Harthio</a> • <a href="{{appUrl}}/unsubscribe?token={{unsubscribeToken}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>',
  'Hi {{firstName}},

You''ve been on Harthio for a week now. How''s your experience been?

I''d love to hear your thoughts:
- What do you like most about Harthio?
- What could be better?
- What features would you like to see?

Your feedback helps shape the future of Harthio. Just reply to this email - I read every response.

Continue Your Journey: {{appUrl}}/dashboard

Thanks for being part of our community!

Best,
Tosin

---
Visit Harthio: {{appUrl}}
Unsubscribe: {{appUrl}}/unsubscribe?token={{unsubscribeToken}}',
  'Check-in email sent 7 days after signup',
  'engagement',
  '["firstName", "appUrl", "unsubscribeToken"]'::jsonb
),
(
  'Re-engagement',
  'We miss you on Harthio!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We miss you!</title>
  <style>
    body { font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: hsl(240, 67%, 94%); }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, hsl(180, 100%, 25%) 0%, hsl(340, 82%, 52%) 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: hsl(180, 100%, 25%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background: hsl(240, 20%, 96%); padding: 30px 20px; text-align: center; font-size: 14px; color: hsl(240, 10%, 40%); }
    .footer a { color: hsl(340, 82%, 52%); text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>👋 We miss you!</h1>
    </div>
    <div class="content">
      <p>Hi {{firstName}},</p>
      
      <p>It''s been a while since we''ve seen you on Harthio. I wanted to reach out personally.</p>
      
      <p>We''ve been making improvements based on user feedback, and I think you''ll like what we''ve built.</p>
      
      <p>If there''s anything that kept you from using Harthio, I''d love to hear about it. Your feedback is invaluable.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{appUrl}}/dashboard" class="button">Come Back & Explore</a>
      </div>
      
      <p>Hope to see you back soon!</p>
      
      <p>Best,<br><strong>Tosin</strong></p>
    </div>
    <div class="footer">
      <p><a href="{{appUrl}}">Visit Harthio</a> • <a href="{{appUrl}}/unsubscribe?token={{unsubscribeToken}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>',
  'Hi {{firstName}},

It''s been a while since we''ve seen you on Harthio. I wanted to reach out personally.

We''ve been making improvements based on user feedback, and I think you''ll like what we''ve built.

If there''s anything that kept you from using Harthio, I''d love to hear about it. Your feedback is invaluable.

Come Back & Explore: {{appUrl}}/dashboard

Hope to see you back soon!

Best,
Tosin

---
Visit Harthio: {{appUrl}}
Unsubscribe: {{appUrl}}/unsubscribe?token={{unsubscribeToken}}',
  'Re-engagement email sent to inactive users (30+ days)',
  're-engagement',
  '["firstName", "appUrl", "unsubscribeToken"]'::jsonb
);

COMMENT ON TABLE email_templates IS 'Pre-built email templates for campaigns';
COMMENT ON TABLE email_campaigns IS 'Email campaigns sent to users';
COMMENT ON TABLE email_campaign_sends IS 'Individual email sends tracking';
COMMENT ON TABLE user_email_preferences IS 'User email subscription preferences';
