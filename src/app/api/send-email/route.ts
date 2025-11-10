import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { moderateRateLimit } from '@/lib/rate-limit';
import { sanitizeError, logSecurityEvent, getSecurityHeaders, isValidEmail } from '@/lib/security-utils';
import { InputSanitizer, SecurityLogger } from '@/lib/security/owasp-security-service';

// Initialize Resend client only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  console.log('📧 [SEND-EMAIL API] Request received');
  
  // Apply rate limiting
  const rateLimitResult = moderateRateLimit(request);
  if (rateLimitResult) {
    console.log('⚠️ [SEND-EMAIL API] Rate limit exceeded');
    logSecurityEvent({
      type: 'rate_limit',
      ip: request.ip || 'unknown',
      endpoint: '/api/send-email',
      details: { reason: 'Email API rate limit exceeded' }
    });
    return rateLimitResult;
  }

  try {
    const { to, subject, html, text, from } = await request.json();
    
    // Log environment variables with whitespace detection
    const emailFromRaw = process.env.EMAIL_FROM_ADDRESS || 'NOT SET';
    const hasWhitespace = emailFromRaw !== emailFromRaw.trim();
    
    console.log('📧 [SEND-EMAIL API] Request data:', {
      to,
      subject,
      hasHtml: !!html,
      hasText: !!text,
      resendConfigured: !!resend,
      resendApiKey: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
      emailFromAddress: emailFromRaw,
      emailFromHasWhitespace: hasWhitespace,
    });
    
    if (hasWhitespace) {
      console.warn('⚠️ [SEND-EMAIL API] EMAIL_FROM_ADDRESS has whitespace - will be trimmed');
    }

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      logSecurityEvent({
        type: 'validation_error',
        ip: request.ip || 'unknown',
        endpoint: '/api/send-email',
        details: { reason: 'Missing required fields' }
      });
      
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      );
    }

    // OWASP: Validate email format
    if (!InputSanitizer.isValidEmail(to)) {
      await SecurityLogger.logSecurityEvent({
        type: 'suspicious_activity',
        ipAddress: request.ip || 'unknown',
        details: `Invalid email format in send-email API: ${to}`,
        severity: 'medium'
      });
      
      logSecurityEvent({
        type: 'validation_error',
        ip: request.ip || 'unknown',
        endpoint: '/api/send-email',
        details: { reason: 'Invalid email format', email: to }
      });
      
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      );
    }

    // Check if Resend is configured
    if (!resend) {
      // Fallback: Log email for development/beta
      console.log('⚠️ [SEND-EMAIL API] Resend not configured - using fallback');
      console.log('📧 EMAIL FALLBACK (Resend not configured):');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML:', html?.substring(0, 200) + '...');
      console.log('Text:', text?.substring(0, 200) + '...');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Email logged (beta mode - Resend not configured)',
        fallback: true
      }, {
        headers: getSecurityHeaders()
      });
    }

    // Send email using Resend
    console.log('📧 [SEND-EMAIL API] Attempting to send via Resend...');
    try {
      // Clean up the from address - remove any whitespace/newlines
      // Use custom from address if provided, otherwise use default
      const fromAddress = from 
        ? from.trim() 
        : (process.env.EMAIL_FROM_ADDRESS || 'Harthio <no-reply@harthio.com>').trim();
      
      const emailPayload = {
        from: fromAddress,
        to: [to],
        subject: subject,
        html: html,
        text: text,
      };
      console.log('📧 [SEND-EMAIL API] Resend payload:', {
        from: emailPayload.from,
        to: emailPayload.to,
        subject: emailPayload.subject,
      });

      const { data, error } = await resend.emails.send(emailPayload);

      if (error) {
        console.error('❌ [SEND-EMAIL API] Resend email error:', error);
        throw error;
      }

      console.log('✅ [SEND-EMAIL API] Email sent successfully via Resend:', data?.id);
      return NextResponse.json({ 
        success: true, 
        messageId: data?.id 
      }, {
        headers: getSecurityHeaders()
      });
    } catch (resendError) {
      console.error('❌ [SEND-EMAIL API] Resend email failed:', resendError);
      console.error('❌ [SEND-EMAIL API] Error details:', {
        message: resendError instanceof Error ? resendError.message : 'Unknown error',
        stack: resendError instanceof Error ? resendError.stack : undefined,
      });
      
      // Fallback: Log email for development
      console.log('📧 EMAIL FALLBACK (Resend failed):');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML:', html?.substring(0, 200) + '...');
      console.log('Text:', text?.substring(0, 200) + '...');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Email logged (fallback mode)',
        fallback: true
      }, {
        headers: getSecurityHeaders()
      });
    }
  } catch (error) {
    const sanitized = sanitizeError(error);
    
    logSecurityEvent({
      type: 'suspicious_activity',
      ip: request.ip || 'unknown',
      endpoint: '/api/send-email',
      details: { 
        error: sanitized.message,
        reason: 'Email API processing failed'
      }
    });
    
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, error: sanitized.message },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    );
  }
}