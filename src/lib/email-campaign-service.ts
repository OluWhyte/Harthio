// ============================================================================
// EMAIL CAMPAIGN SERVICE
// ============================================================================
// Service for managing email campaigns and sending bulk emails

import { supabase } from "./supabase";
import { emailService } from "./email-service";
import { getEmailBaseUrl } from "./url-utils";

const typedSupabase = supabase as any;

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  description?: string;
  category: string;
  variables: string[];
}

export interface EmailCampaign {
  id: string;
  name: string;
  template_id: string;
  from_email: string;
  subject: string;
  audience_filter: 'all' | 'new_users' | 'inactive_users' | 'active_users';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export interface CampaignStats {
  total_campaigns: number;
  total_sent: number;
  total_failed: number;
  recent_campaigns: EmailCampaign[];
}

export const emailCampaignService = {
  // Get all email templates
  async getTemplates(): Promise<EmailTemplate[]> {
    try {
      console.log('📧 [SERVICE] Fetching templates from email_templates table...');
      const { data, error } = await typedSupabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      console.log('📧 [SERVICE] Query result:', { data, error, count: data?.length });
      
      if (error) {
        console.error('📧 [SERVICE] Query error:', error);
        throw error;
      }
      
      console.log('📧 [SERVICE] Returning templates:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('📧 [SERVICE] Error fetching email templates:', error);
      throw error;
    }
  },

  // Get single template
  async getTemplate(id: string): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await typedSupabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching email template:', error);
      return null;
    }
  },

  // Get audience count based on filter
  async getAudienceCount(filter: string, customEmails?: string[]): Promise<number> {
    try {
      // If custom emails provided, return count
      if (filter === 'custom' && customEmails) {
        console.log(`📧 [COUNT] Custom emails: ${customEmails.length}`);
        return customEmails.length;
      }

      console.log(`📧 [COUNT] Getting count for filter: ${filter}`);

      let query = typedSupabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      // Apply filters with precise date ranges
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      switch (filter) {
        case 'test_users':
          // Test users (3 safe test accounts)
          query = query.in('email', [
            'peterlimited2000@gmail.com',
            'whytecleaners@gmail.com',
            'xcrowme@gmail.com'
          ]);
          break;
        
        // Precise date range filters for new users
        case 'new_users_24h':
          // Users created in last 24 hours only
          query = query.gte('created_at', oneDayAgo.toISOString());
          break;
        case 'new_users_1_3d':
          // Users created between 1-3 days ago (not including last 24h)
          query = query
            .gte('created_at', threeDaysAgo.toISOString())
            .lt('created_at', oneDayAgo.toISOString());
          break;
        case 'new_users_3_7d':
          // Users created between 3-7 days ago
          query = query
            .gte('created_at', sevenDaysAgo.toISOString())
            .lt('created_at', threeDaysAgo.toISOString());
          break;
        case 'new_users_7_30d':
          // Users created between 7-30 days ago
          query = query
            .gte('created_at', thirtyDaysAgo.toISOString())
            .lt('created_at', sevenDaysAgo.toISOString());
          break;
        case 'new_users_30plus':
          // Users created more than 30 days ago
          query = query.lt('created_at', thirtyDaysAgo.toISOString());
          break;
        
        // Legacy filters (kept for backward compatibility)
        case 'new_users':
          // Users created in last 3 days
          query = query.gte('created_at', threeDaysAgo.toISOString());
          break;
        case 'new_users_7d':
          // Users created in last 7 days
          query = query.gte('created_at', sevenDaysAgo.toISOString());
          break;
        
        // Activity-based filters
        case 'inactive_users':
          // Users who haven't been active for 30+ days
          query = query.lt('updated_at', thirtyDaysAgo.toISOString());
          break;
        case 'active_users':
          // Users who were active within last 30 days
          query = query.gte('updated_at', thirtyDaysAgo.toISOString());
          break;
        case 'all':
        default:
          // All users
          break;
      }

      const { count, error } = await query;

      if (error) {
        console.error('❌ [COUNT] Query error:', error);
        throw error;
      }

      console.log(`📧 [COUNT] Result: ${count || 0} users`);
      return count || 0;
    } catch (error) {
      console.error('❌ [COUNT] Error getting audience count:', error);
      console.error('❌ [COUNT] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        filter,
      });
      return 0;
    }
  },

  // Get users based on audience filter
  async getAudienceUsers(filter: string, customEmails?: string[]): Promise<any[]> {
    try {
      // If custom emails provided, return them as user objects
      if (filter === 'custom' && customEmails) {
        console.log(`📧 [AUDIENCE] Custom emails mode: ${customEmails.length} emails`);
        return customEmails.map((email, index) => ({
          id: `custom-${index}`,
          email: email.trim(),
          first_name: email.split('@')[0],
          display_name: email.split('@')[0],
          unsubscribed: false // Custom emails bypass unsubscribe
        }));
      }

      console.log(`📧 [AUDIENCE] Fetching users with filter: ${filter}`);

      let query = typedSupabase
        .from('users')
        .select('id, email, first_name, last_name, display_name, created_at, updated_at');

      // Apply filters with precise date ranges
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      switch (filter) {
        case 'test_users':
          // Test users (3 safe test accounts)
          console.log(`📧 [AUDIENCE] Filtering for test users`);
          query = query.in('email', [
            'peterlimited2000@gmail.com',
            'whytecleaners@gmail.com',
            'xcrowme@gmail.com'
          ]);
          break;
        
        // Precise date range filters for new users
        case 'new_users_24h':
          console.log(`📧 [AUDIENCE] Filtering for new users (last 24 hours)`);
          query = query.gte('created_at', oneDayAgo.toISOString());
          break;
        case 'new_users_1_3d':
          console.log(`📧 [AUDIENCE] Filtering for new users (1-3 days ago)`);
          query = query
            .gte('created_at', threeDaysAgo.toISOString())
            .lt('created_at', oneDayAgo.toISOString());
          break;
        case 'new_users_3_7d':
          console.log(`📧 [AUDIENCE] Filtering for new users (3-7 days ago)`);
          query = query
            .gte('created_at', sevenDaysAgo.toISOString())
            .lt('created_at', threeDaysAgo.toISOString());
          break;
        case 'new_users_7_30d':
          console.log(`📧 [AUDIENCE] Filtering for new users (7-30 days ago)`);
          query = query
            .gte('created_at', thirtyDaysAgo.toISOString())
            .lt('created_at', sevenDaysAgo.toISOString());
          break;
        case 'new_users_30plus':
          console.log(`📧 [AUDIENCE] Filtering for users (30+ days ago)`);
          query = query.lt('created_at', thirtyDaysAgo.toISOString());
          break;
        
        // Legacy filters (kept for backward compatibility)
        case 'new_users':
          console.log(`📧 [AUDIENCE] Filtering for new users (last 3 days)`);
          query = query.gte('created_at', threeDaysAgo.toISOString());
          break;
        case 'new_users_7d':
          console.log(`📧 [AUDIENCE] Filtering for new users (last 7 days)`);
          query = query.gte('created_at', sevenDaysAgo.toISOString());
          break;
        
        // Activity-based filters
        case 'inactive_users':
          // Users who haven't updated their profile in 30+ days (inactive)
          console.log(`📧 [AUDIENCE] Filtering for inactive users (30+ days)`);
          query = query.lt('updated_at', thirtyDaysAgo.toISOString());
          break;
        case 'active_users':
          // Users who updated their profile in the last 30 days (active)
          console.log(`📧 [AUDIENCE] Filtering for active users (last 30 days)`);
          query = query.gte('updated_at', thirtyDaysAgo.toISOString());
          break;
        case 'all':
        default:
          console.log(`📧 [AUDIENCE] Fetching all users`);
          break;
      }

      console.log(`📧 [AUDIENCE] Executing query...`);
      const { data, error } = await query;

      if (error) {
        console.error('❌ [AUDIENCE] Query error:', error);
        throw error;
      }

      console.log(`📧 [AUDIENCE] Query returned ${data?.length || 0} users`);

      if (!data || data.length === 0) {
        console.warn('⚠️ [AUDIENCE] No users found for filter:', filter);
        return [];
      }

      // Filter out users who have unsubscribed from MARKETING emails
      // Note: They'll still receive transactional emails (join requests, etc.)
      console.log(`📧 [AUDIENCE] Checking email preferences for ${data.length} users...`);
      const usersWithPrefs = await Promise.all(
        data.map(async (user) => {
          const { data: prefs, error: prefsError } = await typedSupabase
            .from('user_email_preferences')
            .select('unsubscribed_marketing, unsubscribed_all')
            .eq('user_id', user.id)
            .maybeSingle();

          if (prefsError) {
            console.error(`❌ [AUDIENCE] Error fetching prefs for user ${user.id}:`, prefsError);
          }

          return {
            ...user,
            unsubscribed: prefs?.unsubscribed_marketing || prefs?.unsubscribed_all || false
          };
        })
      );

      // Return only users who haven't unsubscribed from marketing
      const finalUsers = usersWithPrefs.filter(user => !user.unsubscribed);
      console.log(`📧 [AUDIENCE] Final count after unsubscribe filter: ${finalUsers.length} users`);
      
      return finalUsers;
    } catch (error) {
      console.error('❌ [AUDIENCE] Error getting audience users:', error);
      console.error('❌ [AUDIENCE] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        filter,
      });
      return [];
    }
  },

  // Create a new campaign
  async createCampaign(campaignData: {
    name: string;
    template_id: string;
    from_email: string;
    subject: string;
    audience_filter: string;
    created_by: string;
    custom_emails?: string[];
  }): Promise<{ success: boolean; campaign?: EmailCampaign; error?: string }> {
    try {
      // Get audience count
      const totalRecipients = await this.getAudienceCount(
        campaignData.audience_filter,
        campaignData.custom_emails
      );

      const { data, error } = await typedSupabase
        .from('email_campaigns')
        .insert({
          name: campaignData.name,
          template_id: campaignData.template_id,
          from_email: campaignData.from_email,
          subject: campaignData.subject,
          audience_filter: campaignData.audience_filter,
          created_by: campaignData.created_by,
          total_recipients: totalRecipients,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, campaign: data };
    } catch (error) {
      console.error('Error creating campaign:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Send campaign
  async sendCampaign(campaignId: string, customEmails?: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 [CAMPAIGN] Starting sendCampaign for ID: ${campaignId}`);
      console.log(`📧 [CAMPAIGN] Custom emails provided:`, customEmails);
      
      // Get campaign details
      const { data: campaign, error: campaignError } = await typedSupabase
        .from('email_campaigns')
        .select('*, template:email_templates(*)')
        .eq('id', campaignId)
        .single();

      if (campaignError) {
        console.error('❌ [CAMPAIGN] Error fetching campaign:', campaignError);
        throw campaignError;
      }
      if (!campaign) {
        console.error('❌ [CAMPAIGN] Campaign not found');
        throw new Error('Campaign not found');
      }

      console.log(`📧 [CAMPAIGN] Campaign loaded:`, {
        name: campaign.name,
        from: campaign.from_email,
        subject: campaign.subject,
        filter: campaign.audience_filter
      });

      // Update status to sending
      await typedSupabase
        .from('email_campaigns')
        .update({ status: 'sending' })
        .eq('id', campaignId);

      // Get audience
      console.log(`📧 [CAMPAIGN] Fetching audience with filter: ${campaign.audience_filter}`);
      const users = await this.getAudienceUsers(campaign.audience_filter, customEmails);

      console.log(`📧 [CAMPAIGN] Sending campaign "${campaign.name}" to ${users.length} users`);
      console.log(`📧 [CAMPAIGN] First 3 recipients:`, users.slice(0, 3).map(u => u.email));

      let sentCount = 0;
      let failedCount = 0;

      // Send emails one at a time with delay to respect Resend's rate limit (2 per second)
      // Using sequential sending instead of batches to avoid 429 errors
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        try {
          // Replace variables in template
          const variables = {
            firstName: user.first_name || user.display_name || 'there',
            appUrl: getEmailBaseUrl(), // Environment-aware URL (production or localhost)
            unsubscribeToken: user.id // In production, generate a proper token
          };

          let htmlContent = campaign.template.html_content;
          let textContent = campaign.template.text_content;
          let subject = campaign.subject;

          // Replace all variables
          Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            htmlContent = htmlContent.replace(regex, value);
            textContent = textContent.replace(regex, value);
            subject = subject.replace(regex, value);
          });

          // Apply dynamic signature based on sender
          const { htmlSignature, textSignature } = this.getEmailSignature(campaign.from_email);
          
          // Replace Tosin signature with dynamic one in HTML (both old "Founder" and new "Co-founder" versions)
          htmlContent = htmlContent.replace(
            /<p>Best,<br><strong>Tosin<\/strong><br>Founder, Harthio<\/p>/g,
            htmlSignature
          );
          htmlContent = htmlContent.replace(
            /<p>Best,<br><strong>Tosin<\/strong><br>Co-founder, Harthio<\/p>/g,
            htmlSignature
          );
          htmlContent = htmlContent.replace(
            /<p>Cheers,<br><strong>Tosin<\/strong><\/p>/g,
            htmlSignature
          );
          htmlContent = htmlContent.replace(
            /<p>Hope to see you back soon!<\/p>\s*<p>Best,<br><strong>Tosin<\/strong><\/p>/g,
            `<p>Hope to see you back soon!</p>\n${htmlSignature}`
          );
          
          // Replace in text version (both old and new versions)
          textContent = textContent.replace(/Best,\nTosin\nFounder, Harthio/g, textSignature);
          textContent = textContent.replace(/Best,\nTosin\nCo-founder, Harthio/g, textSignature);
          textContent = textContent.replace(/Best,\nTosin/g, textSignature);
          textContent = textContent.replace(/Cheers,\nTosin/g, textSignature);

          console.log(`📧 [CAMPAIGN] Sending to ${user.email} (${i + 1}/${users.length})`);

          // Send email
          const sent = await emailService.sendEmail(user.email, {
            subject,
            html: htmlContent,
            text: textContent
          }, campaign.from_email);

          // Track send
          await typedSupabase
            .from('email_campaign_sends')
            .insert({
              campaign_id: campaignId,
              user_id: user.id,
              email: user.email,
              status: sent ? 'sent' : 'failed',
              sent_at: sent ? new Date().toISOString() : null,
              error_message: sent ? null : 'Failed to send'
            });

          if (sent) {
            sentCount++;
            console.log(`✅ [CAMPAIGN] Sent to ${user.email}`);
          } else {
            failedCount++;
            console.log(`❌ [CAMPAIGN] Failed to send to ${user.email}`);
          }
        } catch (error) {
          console.error(`❌ [CAMPAIGN] Error sending to ${user.email}:`, error);
          failedCount++;

          // Track failed send
          await typedSupabase
            .from('email_campaign_sends')
            .insert({
              campaign_id: campaignId,
              user_id: user.id,
              email: user.email,
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        // Delay between emails to respect Resend rate limit and avoid spam triggers
        // Using 3 seconds per email for safety (100 users = ~5 minutes)
        if (i < users.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Update campaign status
      await typedSupabase
        .from('email_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_count: sentCount,
          failed_count: failedCount
        })
        .eq('id', campaignId);

      console.log(`✅ Campaign sent: ${sentCount} successful, ${failedCount} failed`);

      return { success: true };
    } catch (error) {
      console.error('Error sending campaign:', error);

      // Update campaign status to failed
      await typedSupabase
        .from('email_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Get all campaigns
  async getCampaigns(): Promise<EmailCampaign[]> {
    try {
      const { data, error } = await typedSupabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
  },

  // Get campaign stats
  async getCampaignStats(): Promise<CampaignStats> {
    try {
      const campaigns = await this.getCampaigns();

      const stats: CampaignStats = {
        total_campaigns: campaigns.length,
        total_sent: campaigns.reduce((sum, c) => sum + c.sent_count, 0),
        total_failed: campaigns.reduce((sum, c) => sum + c.failed_count, 0),
        recent_campaigns: campaigns.slice(0, 5)
      };

      return stats;
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
      return {
        total_campaigns: 0,
        total_sent: 0,
        total_failed: 0,
        recent_campaigns: []
      };
    }
  },

  // Delete campaign
  async deleteCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await typedSupabase
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Get campaign recipients
  async getCampaignRecipients(campaignId: string): Promise<any[]> {
    try {
      const { data, error } = await typedSupabase
        .from('email_campaign_sends')
        .select('email, status, sent_at, error_message')
        .eq('campaign_id', campaignId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaign recipients:', error);
      return [];
    }
  },

  // Get dynamic email signature based on sender
  getEmailSignature(fromEmail: string): { htmlSignature: string; textSignature: string } {
    if (fromEmail.includes('tosin@')) {
      return {
        htmlSignature: '<p>Best,<br><strong>Tosin</strong><br>Co-founder, Harthio</p>',
        textSignature: 'Best,\nTosin\nCo-founder, Harthio'
      };
    } else if (fromEmail.includes('seyi@')) {
      return {
        htmlSignature: '<p>Best regards,<br><strong>Seyi</strong><br>Founder, Harthio</p>',
        textSignature: 'Best regards,\nSeyi\nFounder, Harthio'
      };
    } else {
      // no-reply or generic
      return {
        htmlSignature: '<p>Best regards,<br><strong>The Harthio Team</strong></p>',
        textSignature: 'Best regards,\nThe Harthio Team'
      };
    }
  }
};
