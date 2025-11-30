import { NextRequest, NextResponse } from 'next/server';
import { emailService, emailTemplates } from '@/lib/email-service';
import { z } from 'zod';
import { emailRateLimit } from '@/lib/rate-limit';
import { sanitizeError, logSecurityEvent, getSecurityHeaders, sanitizeInput } from '@/lib/security-utils';
import { InputSanitizer, SecurityLogger } from '@/lib/security/owasp-security-service';
import { Resend } from 'resend';
import { validateCSRFToken } from '@/lib/csrf-middleware';

// Validation schema for contact form
const contactSchema = z.object({
  userName: z.string().min(1, 'Name is required'),
  userEmail: z.string().email('Valid email is required'),
  topic: z.enum(['feedback', 'feature', 'issue'], {
    required_error: 'Topic is required',
  }),
  message: z.string().min(10, 'Message must be at least 10 characters').max(500, 'Message must be less than 500 characters'),
});

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = emailRateLimit(request);
  if (rateLimitResult) {
    logSecurityEvent({
      type: 'rate_limit',
      ip: request.ip || 'unknown',
      endpoint: '/api/contact',
      details: { reason: 'Email rate limit exceeded' }
    });
    return rateLimitResult;
  }

  // Validate CSRF token
  const csrfValid = validateCSRFToken(request);
  if (!csrfValid) {
    return NextResponse.json(
      { error: 'CSRF validation failed', message: 'Security check failed. Please refresh and try again.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Validate the request data
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid form data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { userName, userEmail, topic, message } = validationResult.data;

    // OWASP: Sanitize inputs to prevent XSS
    const sanitizedUserName = InputSanitizer.sanitizeHTML(sanitizeInput(userName, 100));
    const sanitizedMessage = InputSanitizer.sanitizeHTML(sanitizeInput(message, 500));

    // OWASP: Validate email format
    if (!InputSanitizer.isValidEmail(userEmail)) {
      await SecurityLogger.logSecurityEvent({
        type: 'suspicious_activity',
        ipAddress: request.ip || 'unknown',
        details: 'Invalid email format in contact form',
        severity: 'low'
      });
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('📧 Processing contact form submission:', {
      userName: sanitizedUserName,
      userEmail,
      topic,
      messageLength: sanitizedMessage.length,
      ip: request.ip || 'unknown'
    });

    // Send emails directly using Resend (avoid internal fetch issues)
    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://harthio.com';

    let adminNotificationSent = false;
    let autoReplySent = false;

    if (resend) {
      try {
        // Send notification to admin
        const adminTemplate = emailTemplates.contactUsNotification({
          userName: sanitizedUserName,
          userEmail,
          topic,
          message: sanitizedMessage,
          appUrl
        });

        const adminResult = await resend.emails.send({
          from: process.env.EMAIL_FROM_ADDRESS?.trim() || 'Harthio <no-reply@harthio.com>',
          to: 'tosin@harthio.com',
          subject: adminTemplate.subject,
          html: adminTemplate.html,
          text: adminTemplate.text,
        });

        adminNotificationSent = !adminResult.error;
        if (adminResult.error) {
          console.error('❌ Admin notification error:', adminResult.error);
        } else {
          console.log('✅ Admin notification sent:', adminResult.data?.id);
        }
      } catch (error) {
        console.error('❌ Failed to send admin notification:', error);
      }

      try {
        // Send auto-reply to user
        const autoReplyTemplate = emailTemplates.contactUsAutoReply({
          userName: sanitizedUserName,
          topic,
          appUrl
        });

        const autoReplyResult = await resend.emails.send({
          from: process.env.EMAIL_FROM_ADDRESS?.trim() || 'Harthio <no-reply@harthio.com>',
          to: userEmail,
          subject: autoReplyTemplate.subject,
          html: autoReplyTemplate.html,
          text: autoReplyTemplate.text,
        });

        autoReplySent = !autoReplyResult.error;
        if (autoReplyResult.error) {
          console.error('❌ Auto-reply error:', autoReplyResult.error);
        } else {
          console.log('✅ Auto-reply sent:', autoReplyResult.data?.id);
        }
      } catch (error) {
        console.error('❌ Failed to send auto-reply:', error);
      }
    } else {
      console.log('⚠️ Resend not configured - emails not sent');
    }

    // Log results
    console.log('📧 Contact form email results:', {
      adminNotificationSent,
      autoReplySent,
      userEmail
    });

    // Return success even if emails fail (for beta mode)
    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you soon!',
      emailsSent: {
        adminNotification: adminNotificationSent,
        autoReply: autoReplySent
      }
    }, {
      headers: getSecurityHeaders()
    });

  } catch (error) {
    const sanitized = sanitizeError(error);

    logSecurityEvent({
      type: 'suspicious_activity',
      ip: request.ip || 'unknown',
      endpoint: '/api/contact',
      details: {
        error: sanitized.message,
        reason: 'Contact form processing failed'
      }
    });

    console.error('❌ Contact form API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: sanitized.message
      },
      {
        status: 500,
        headers: getSecurityHeaders()
      }
    );
  }
}