// ============================================================================
// EMAIL SERVICE
// ============================================================================
// Service for sending email notifications using Supabase Auth

// Email template types
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email data interfaces
export interface NewRequestEmailData {
  requesterName: string;
  sessionTitle: string;
  sessionDescription?: string;
  requestMessage?: string;
  appUrl: string;
}

export interface RequestApprovedEmailData {
  approverName: string;
  sessionTitle: string;
  sessionStartTime: string;
  sessionUrl: string;
  appUrl: string;
}

export interface RequestDeclinedEmailData {
  sessionTitle: string;
  appUrl: string;
}

export interface RequestCancelledEmailData {
  requesterName: string;
  sessionTitle: string;
  appUrl: string;
}

// Email templates
export const emailTemplates = {
  // Template for when User A sends request to User B
  newRequest: (data: NewRequestEmailData): EmailTemplate => ({
    subject: `New Video Call Request from ${data.requesterName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Video Call Request</title>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: hsl(240, 67%, 94%); }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, hsl(340, 82%, 52%) 0%, hsl(180, 100%, 25%) 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background: hsl(340, 82%, 52%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 5px; transition: all 0.2s ease; }
            .button:hover { background: hsl(340, 82%, 47%); transform: translateY(-1px); }
            .button-secondary { background: hsl(240, 20%, 90%); color: hsl(240, 10%, 20%); }
            .button-secondary:hover { background: hsl(240, 20%, 85%); }
            .message-box { background: hsl(240, 60%, 98%); border-left: 4px solid hsl(340, 82%, 52%); padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { background: hsl(240, 20%, 96%); padding: 20px; text-align: center; font-size: 14px; color: hsl(240, 10%, 40%); }
            .footer a { color: hsl(340, 82%, 52%); text-decoration: none; }
            .footer a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎥 New Video Call Request</h1>
              <p>Someone wants to connect with you on Harthio</p>
            </div>
            <div class="content">
              <h2>Hi there!</h2>
              <p><strong>${
                data.requesterName
              }</strong> has sent you a request for a video call session:</p>
              
              <div class="message-box">
                <h3>"${data.sessionTitle}"</h3>
                ${
                  data.sessionDescription
                    ? `<p><em>${data.sessionDescription}</em></p>`
                    : ""
                }
                ${
                  data.requestMessage
                    ? `<p><strong>Message from ${data.requesterName}:</strong><br>"${data.requestMessage}"</p>`
                    : ""
                }
              </div>
              
              <p>Please log in to your Harthio account to review and respond to this request.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${
                  data.appUrl
                }/requests" class="button">Review Request</a>
              </div>
              
              <p><small>You can approve or decline this request from your dashboard. If you approve, both of you will receive the video call link.</small></p>
            </div>
            <div class="footer">
              <p>This email was sent by Harthio - Platform for meaningful conversations</p>
              <p><a href="${data.appUrl}">Visit Harthio</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
New Video Call Request from ${data.requesterName}

Hi there!

${data.requesterName} has sent you a request for a video call session: "${
      data.sessionTitle
    }"

${data.sessionDescription ? `Description: ${data.sessionDescription}` : ""}
${
  data.requestMessage
    ? `Message from ${data.requesterName}: "${data.requestMessage}"`
    : ""
}

Please log in to your Harthio account to review and respond to this request.

Review Request: ${data.appUrl}/requests

You can approve or decline this request from your dashboard. If you approve, both of you will receive the video call link.

---
This email was sent by Harthio - Platform for meaningful conversations
Visit: ${data.appUrl}
    `,
  }),

  // Template for when User B approves request (sent to User A)
  requestApproved: (data: RequestApprovedEmailData): EmailTemplate => ({
    subject: `Your Video Call Request with ${data.approverName} Has Been Approved`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Request Approved</title>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: hsl(240, 67%, 94%); }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, hsl(180, 100%, 25%) 0%, hsl(340, 82%, 52%) 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background: hsl(180, 100%, 25%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 5px; font-size: 16px; transition: all 0.2s ease; }
            .button:hover { background: hsl(180, 100%, 20%); transform: translateY(-1px); }
            .highlight-box { background: hsl(180, 100%, 95%); border: 2px solid hsl(180, 100%, 25%); padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .footer { background: hsl(240, 20%, 96%); padding: 20px; text-align: center; font-size: 14px; color: hsl(240, 10%, 40%); }
            .footer a { color: hsl(340, 82%, 52%); text-decoration: none; }
            .footer a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Request Approved!</h1>
              <p>Your video call is ready</p>
            </div>
            <div class="content">
              <h2>Great news!</h2>
              <p><strong>${data.approverName}</strong> has approved your request for the video call session:</p>
              
              <div class="highlight-box">
                <h3>"${data.sessionTitle}"</h3>
                <p><strong>Session Time:</strong> ${data.sessionStartTime}</p>
              </div>
              
              <p>Click the button below to join your video call:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.sessionUrl}" class="button">Join Video Call</a>
              </div>
              
              <p><strong>Important:</strong> Make sure to join at the scheduled time. Both participants will receive this link.</p>
              
              <p><small>If you have any issues joining the call, you can also access it from your dashboard.</small></p>
            </div>
            <div class="footer">
              <p>This email was sent by Harthio - Platform for meaningful conversations</p>
              <p><a href="${data.appUrl}">Visit Harthio</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Your Video Call Request with ${data.approverName} Has Been Approved

Great news!

${data.approverName} has approved your request for the video call session: "${data.sessionTitle}"

Session Time: ${data.sessionStartTime}

Join Video Call: ${data.sessionUrl}

Important: Make sure to join at the scheduled time. Both participants will receive this link.

If you have any issues joining the call, you can also access it from your dashboard at ${data.appUrl}

---
This email was sent by Harthio - Platform for meaningful conversations
Visit: ${data.appUrl}
    `,
  }),

  // Template for when User B approves request (sent to User B as confirmation)
  requestApprovedConfirmation: (
    data: RequestApprovedEmailData
  ): EmailTemplate => ({
    subject: `Your Video Call with ${data.approverName} is Ready`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Video Call Ready</title>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: hsl(240, 67%, 94%); }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, hsl(340, 82%, 52%) 0%, hsl(180, 100%, 25%) 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background: hsl(340, 82%, 52%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 5px; font-size: 16px; transition: all 0.2s ease; }
            .button:hover { background: hsl(340, 82%, 47%); transform: translateY(-1px); }
            .highlight-box { background: hsl(340, 82%, 97%); border: 2px solid hsl(340, 82%, 52%); padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .footer { background: hsl(240, 20%, 96%); padding: 20px; text-align: center; font-size: 14px; color: hsl(240, 10%, 40%); }
            .footer a { color: hsl(340, 82%, 52%); text-decoration: none; }
            .footer a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📞 Video Call Ready</h1>
              <p>You've approved the request</p>
            </div>
            <div class="content">
              <h2>All set!</h2>
              <p>You've approved the video call request. Here are your session details:</p>
              
              <div class="highlight-box">
                <h3>"${data.sessionTitle}"</h3>
                <p><strong>Session Time:</strong> ${data.sessionStartTime}</p>
              </div>
              
              <p>Click the button below to join your video call:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.sessionUrl}" class="button">Join Video Call</a>
              </div>
              
              <p>The other participant has also received the call link and will be notified that you've approved their request.</p>
            </div>
            <div class="footer">
              <p>This email was sent by Harthio - Platform for meaningful conversations</p>
              <p><a href="${data.appUrl}">Visit Harthio</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Your Video Call is Ready

All set!

You've approved the video call request. Here are your session details:

"${data.sessionTitle}"
Session Time: ${data.sessionStartTime}

Join Video Call: ${data.sessionUrl}

The other participant has also received the call link and will be notified that you've approved their request.

---
This email was sent by Harthio - Platform for meaningful conversations
Visit: ${data.appUrl}
    `,
  }),

  // Template for when User B declines request (sent to User A)
  requestDeclined: (data: RequestDeclinedEmailData): EmailTemplate => ({
    subject: `Your Video Call Request Was Declined`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Request Declined</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #a0aec0 0%, #718096 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
            .button:hover { background: #5a67d8; }
            .info-box { background: #f7fafc; border-left: 4px solid #a0aec0; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Request Update</h1>
              <p>Your video call request status</p>
            </div>
            <div class="content">
              <h2>Request Declined</h2>
              <p>Your request for the video call session <strong>"${data.sessionTitle}"</strong> has been declined.</p>
              
              <div class="info-box">
                <p>Don't worry! This happens sometimes due to scheduling conflicts or other reasons. You're welcome to send a new request or explore other sessions on Harthio.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.appUrl}/dashboard" class="button">Explore Sessions</a>
              </div>
              
              <p>You can find other interesting sessions or schedule your own on the dashboard.</p>
            </div>
            <div class="footer">
              <p>This email was sent by Harthio - Platform for meaningful conversations</p>
              <p><a href="${data.appUrl}">Visit Harthio</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Request Update - Your video call request status

Request Declined

Your request for the video call session "${data.sessionTitle}" has been declined.

Don't worry! This happens sometimes due to scheduling conflicts or other reasons. You're welcome to send a new request or explore other sessions on Harthio.

Explore Sessions: ${data.appUrl}/dashboard

You can find other interesting sessions or schedule your own on the dashboard.

---
This email was sent by Harthio - Platform for meaningful conversations
Visit: ${data.appUrl}
    `,
  }),

  // Template for when User A cancels request (sent to User B)
  requestCancelled: (data: RequestCancelledEmailData): EmailTemplate => ({
    subject: `Video Call Request from ${data.requesterName} Has Been Canceled`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Request Cancelled</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #a0aec0 0%, #718096 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
            .button:hover { background: #5a67d8; }
            .info-box { background: #f7fafc; border-left: 4px solid #a0aec0; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Request Cancelled</h1>
              <p>No action needed</p>
            </div>
            <div class="content">
              <h2>Request Withdrawn</h2>
              <p><strong>${data.requesterName}</strong> has cancelled their request for the video call session <strong>"${data.sessionTitle}"</strong>.</p>
              
              <div class="info-box">
                <p>No action is needed from you. The request has been withdrawn and is no longer pending your response.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.appUrl}/dashboard" class="button">View Dashboard</a>
              </div>
              
              <p>You can continue exploring other sessions or manage your own on the dashboard.</p>
            </div>
            <div class="footer">
              <p>This email was sent by Harthio - Platform for meaningful conversations</p>
              <p><a href="${data.appUrl}">Visit Harthio</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Request Cancelled - No action needed

Request Withdrawn

${data.requesterName} has cancelled their request for the video call session "${data.sessionTitle}".

No action is needed from you. The request has been withdrawn and is no longer pending your response.

View Dashboard: ${data.appUrl}/dashboard

You can continue exploring other sessions or manage your own on the dashboard.

---
This email was sent by Harthio - Platform for meaningful conversations
Visit: ${data.appUrl}
    `,
  }),
};

// Email service class
export class EmailService {
  private appUrl: string;

  constructor() {
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://harthio.com";
  }

  // Send email using Supabase Auth (requires setup in Supabase dashboard)
  private async sendEmail(
    to: string,
    template: EmailTemplate
  ): Promise<boolean> {
    try {
      // Note: This requires Supabase Auth email templates to be configured
      // For now, we'll use a custom API route that you'll need to create
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email API responded with status: ${response.status}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  // Send new request notification to User B
  async sendNewRequestNotification(
    recipientEmail: string,
    data: NewRequestEmailData
  ): Promise<boolean> {
    const template = emailTemplates.newRequest({
      ...data,
      appUrl: this.appUrl,
    });

    return this.sendEmail(recipientEmail, template);
  }

  // Send approval notification to User A
  async sendRequestApprovedNotification(
    requesterEmail: string,
    data: RequestApprovedEmailData
  ): Promise<boolean> {
    const template = emailTemplates.requestApproved({
      ...data,
      appUrl: this.appUrl,
    });

    return this.sendEmail(requesterEmail, template);
  }

  // Send approval confirmation to User B
  async sendRequestApprovedConfirmation(
    approverEmail: string,
    data: RequestApprovedEmailData
  ): Promise<boolean> {
    const template = emailTemplates.requestApprovedConfirmation({
      ...data,
      appUrl: this.appUrl,
    });

    return this.sendEmail(approverEmail, template);
  }

  // Send decline notification to User A
  async sendRequestDeclinedNotification(
    requesterEmail: string,
    data: RequestDeclinedEmailData
  ): Promise<boolean> {
    const template = emailTemplates.requestDeclined({
      ...data,
      appUrl: this.appUrl,
    });

    return this.sendEmail(requesterEmail, template);
  }

  // Send cancellation notification to User B
  async sendRequestCancelledNotification(
    recipientEmail: string,
    data: RequestCancelledEmailData
  ): Promise<boolean> {
    const template = emailTemplates.requestCancelled({
      ...data,
      appUrl: this.appUrl,
    });

    return this.sendEmail(recipientEmail, template);
  }
}

// Export singleton instance
export const emailService = new EmailService();
