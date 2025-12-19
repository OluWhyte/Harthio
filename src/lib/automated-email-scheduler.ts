// ============================================================================
// AUTOMATED EMAIL SCHEDULER
// ============================================================================
// Service for automatically sending onboarding and re-engagement emails

import { supabase } from './supabase';
import { emailCampaignService } from './email-campaign-service';
import { getEmailBaseUrl } from './url-utils';
import { createClient } from '@supabase/supabase-js';

// Use service role for server-side operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const typedSupabase = serviceSupabase as any;

interface UserForEmail {
  user_id: string;
  email: string;
  first_name: string | null;
  display_name: string | null;
  created_at: string;
  updated_at?: string;
}

export const automatedEmailScheduler = {
  /**
   * Send welcome emails to users registered in last 24 hours
   * Should run daily at 7 AM
   */
  async sendWelcomeEmails(): Promise<{ sent: number; failed: number; skipped: number }> {
    console.log('📧 [SCHEDULER] Starting welcome email batch...');
    
    try {
      // Get users who need welcome email
      const { data: users, error } = await typedSupabase
        .rpc('get_users_for_welcome_email');

      if (error) {
        console.error('❌ [SCHEDULER] Error fetching users for welcome email:', error);
        throw error;
      }

      if (!users || users.length === 0) {
        console.log('📧 [SCHEDULER] No users need welcome email');
        return { sent: 0, failed: 0, skipped: 0 };
      }

      console.log(`📧 [SCHEDULER] Found ${users.length} users for welcome email`);

      // Get welcome email template directly with service role
      const { data: templates, error: templateError } = await serviceSupabase
        .from('email_templates')
        .select('*');
      
      if (templateError) {
        console.error('❌ [SCHEDULER] Error fetching templates:', templateError);
        throw templateError;
      }
      
      const welcomeTemplate = templates?.find(t => t.name === 'Welcome Email');

      if (!welcomeTemplate) {
        console.error('❌ [SCHEDULER] Welcome email template not found');
        return { sent: 0, failed: 0, skipped: users?.length || 0 };
      }

      return await this.sendEmailBatch(users, welcomeTemplate, 'welcome', 'Tosin from Harthio <tosin@harthio.com>');
    } catch (error) {
      console.error('❌ [SCHEDULER] Error in sendWelcomeEmails:', error);
      return { sent: 0, failed: 0, skipped: 0 };
    }
  },

  /**
   * Send day 3 follow-up to users registered 1-3 days ago
   * Should run daily at 7 AM
   */
  async sendDay3Emails(): Promise<{ sent: number; failed: number; skipped: number }> {
    console.log('📧 [SCHEDULER] Starting day 3 email batch...');
    
    try {
      const { data: users, error } = await typedSupabase
        .rpc('get_users_for_day3_email');

      if (error) {
        console.error('❌ [SCHEDULER] Error fetching users for day 3 email:', error);
        throw error;
      }

      if (!users || users.length === 0) {
        console.log('📧 [SCHEDULER] No users need day 3 email');
        return { sent: 0, failed: 0, skipped: 0 };
      }

      console.log(`📧 [SCHEDULER] Found ${users.length} users for day 3 email`);

      // Get day 3 email template directly with service role
      const { data: templates, error: templateError } = await serviceSupabase
        .from('email_templates')
        .select('*');
      
      if (templateError) {
        console.error('❌ [SCHEDULER] Error fetching templates:', templateError);
        throw templateError;
      }
      
      const day3Template = templates?.find(t => t.name === 'Day 3 Follow-up');

      if (!day3Template) {
        console.error('❌ [SCHEDULER] Day 3 email template not found');
        return { sent: 0, failed: 0, skipped: users.length };
      }

      return await this.sendEmailBatch(users, day3Template, 'day_3', 'Tosin from Harthio <tosin@harthio.com>');
    } catch (error) {
      console.error('❌ [SCHEDULER] Error in sendDay3Emails:', error);
      return { sent: 0, failed: 0, skipped: 0 };
    }
  },

  /**
   * Send week 1 check-in to users registered 3-7 days ago
   * Should run daily at 7 AM
   */
  async sendWeek1Emails(): Promise<{ sent: number; failed: number; skipped: number }> {
    console.log('📧 [SCHEDULER] Starting week 1 email batch...');
    
    try {
      const { data: users, error } = await typedSupabase
        .rpc('get_users_for_week1_email');

      if (error) {
        console.error('❌ [SCHEDULER] Error fetching users for week 1 email:', error);
        throw error;
      }

      if (!users || users.length === 0) {
        console.log('📧 [SCHEDULER] No users need week 1 email');
        return { sent: 0, failed: 0, skipped: 0 };
      }

      console.log(`📧 [SCHEDULER] Found ${users.length} users for week 1 email`);

      // Get week 1 email template directly with service role
      const { data: templates, error: templateError } = await serviceSupabase
        .from('email_templates')
        .select('*');
      
      if (templateError) {
        console.error('❌ [SCHEDULER] Error fetching templates:', templateError);
        throw templateError;
      }
      
      const week1Template = templates?.find(t => t.name === 'Week 1 Check-in');

      if (!week1Template) {
        console.error('❌ [SCHEDULER] Week 1 email template not found');
        return { sent: 0, failed: 0, skipped: users.length };
      }

      return await this.sendEmailBatch(users, week1Template, 'week_1', 'Tosin from Harthio <tosin@harthio.com>');
    } catch (error) {
      console.error('❌ [SCHEDULER] Error in sendWeek1Emails:', error);
      return { sent: 0, failed: 0, skipped: 0 };
    }
  },

  /**
   * Send re-engagement email to inactive users (30+ days)
   * Should run daily at 7 AM
   */
  async sendInactiveEmails(): Promise<{ sent: number; failed: number; skipped: number }> {
    console.log('📧 [SCHEDULER] Starting inactive user email batch...');
    
    try {
      const { data: users, error } = await typedSupabase
        .rpc('get_users_for_inactive_email');

      if (error) {
        console.error('❌ [SCHEDULER] Error fetching inactive users:', error);
        throw error;
      }

      if (!users || users.length === 0) {
        console.log('📧 [SCHEDULER] No inactive users need email');
        return { sent: 0, failed: 0, skipped: 0 };
      }

      console.log(`📧 [SCHEDULER] Found ${users.length} inactive users for re-engagement email`);

      // Get re-engagement email template directly with service role
      const { data: templates, error: templateError } = await serviceSupabase
        .from('email_templates')
        .select('*');
      
      if (templateError) {
        console.error('❌ [SCHEDULER] Error fetching templates:', templateError);
        throw templateError;
      }
      
      const inactiveTemplate = templates?.find(t => t.name === 'Re-engagement');

      if (!inactiveTemplate) {
        console.error('❌ [SCHEDULER] Re-engagement email template not found');
        return { sent: 0, failed: 0, skipped: users.length };
      }

      return await this.sendEmailBatch(users, inactiveTemplate, 'inactive', 'Tosin from Harthio <tosin@harthio.com>');
    } catch (error) {
      console.error('❌ [SCHEDULER] Error in sendInactiveEmails:', error);
      return { sent: 0, failed: 0, skipped: 0 };
    }
  },

  /**
   * Run all automated email jobs
   * This is the main function to call from cron
   */
  async runAllJobs(): Promise<{
    welcome: { sent: number; failed: number; skipped: number };
    day3: { sent: number; failed: number; skipped: number };
    week1: { sent: number; failed: number; skipped: number };
    inactive: { sent: number; failed: number; skipped: number };
  }> {
    console.log('📧 [SCHEDULER] ========================================');
    console.log('📧 [SCHEDULER] Starting automated email scheduler');
    console.log('📧 [SCHEDULER] Time:', new Date().toISOString());
    console.log('📧 [SCHEDULER] ========================================');

    const results = {
      welcome: await this.sendWelcomeEmails(),
      day3: await this.sendDay3Emails(),
      week1: await this.sendWeek1Emails(),
      inactive: await this.sendInactiveEmails()
    };

    console.log('📧 [SCHEDULER] ========================================');
    console.log('📧 [SCHEDULER] Automated email scheduler completed');
    console.log('📧 [SCHEDULER] Results:', JSON.stringify(results, null, 2));
    console.log('📧 [SCHEDULER] ========================================');

    return results;
  },

  /**
   * Helper function to send email batch
   */
  async sendEmailBatch(
    users: UserForEmail[],
    template: any,
    emailType: string,
    fromEmail: string
  ): Promise<{ sent: number; failed: number; skipped: number }> {
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        // Replace variables in template
        const variables = {
          firstName: user.first_name || user.display_name || 'there',
          appUrl: getEmailBaseUrl(),
          unsubscribeToken: user.user_id
        };

        let htmlContent = template.html_content;
        let textContent = template.text_content;
        let subject = template.subject;

        // Replace all variables
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          htmlContent = htmlContent.replace(regex, value);
          textContent = textContent.replace(regex, value);
          subject = subject.replace(regex, value);
        });

        console.log(`📧 [SCHEDULER] Sending ${emailType} to ${user.email}`);

        // Send email directly via Resend (bypass API authentication issues)
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const sendResult = await resend.emails.send({
          from: fromEmail,
          to: [user.email],
          subject,
          html: htmlContent,
          text: textContent
        });
        
        const success = !sendResult.error;

        if (success) {
          // Log successful send
          await typedSupabase.rpc('log_automated_email', {
            p_user_id: user.user_id,
            p_email_type: emailType,
            p_template_id: template.id,
            p_status: 'sent'
          });
          sent++;
          console.log(`✅ [SCHEDULER] Sent ${emailType} to ${user.email}`, sendResult.data?.id);
        } else {
          // Log failed send
          await typedSupabase.rpc('log_automated_email', {
            p_user_id: user.user_id,
            p_email_type: emailType,
            p_template_id: template.id,
            p_status: 'failed',
            p_error_message: sendResult.error?.message || 'Email service failed'
          });
          failed++;
          console.log(`❌ [SCHEDULER] Failed to send ${emailType} to ${user.email}`);
        }

        // Delay between emails (3 seconds to respect rate limits)
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`❌ [SCHEDULER] Error sending ${emailType} to ${user.email}:`, error);
        
        // Log error
        await typedSupabase.rpc('log_automated_email', {
          p_user_id: user.user_id,
          p_email_type: emailType,
          p_template_id: template.id,
          p_status: 'failed',
          p_error_message: error instanceof Error ? error.message : 'Unknown error'
        });
        
        failed++;
      }
    }

    return { sent, failed, skipped };
  }
};
