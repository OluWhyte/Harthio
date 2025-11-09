import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';
import { z } from 'zod';
import { emailRateLimit } from '@/lib/rate-limit';
import { sanitizeError, logSecurityEvent, getSecurityHeaders, sanitizeInput } from '@/lib/security-utils';
import { InputSanitizer, SecurityLogger } from '@/lib/security/owasp-security-service';

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

    // Send notification to admin (tosin@harthio.com)
    const adminNotificationSent = await emailService.sendContactUsNotification({
      userName: sanitizedUserName,
      userEmail,
      topic,
      message: sanitizedMessage,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://harthio.com'
    });

    // Send auto-reply to user
    const autoReplySent = await emailService.sendContactUsAutoReply(userEmail, {
      userName: sanitizedUserName,
      topic,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://harthio.com'
    });

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