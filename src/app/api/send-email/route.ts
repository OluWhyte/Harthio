import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { moderateRateLimit } from '@/lib/rate-limit';
import { sanitizeError, logSecurityEvent, getSecurityHeaders, isValidEmail } from '@/lib/security-utils';

// Initialize Resend client only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = moderateRateLimit(request);
  if (rateLimitResult) {
    logSecurityEvent({
      type: 'rate_limit',
      ip: request.ip || 'unknown',
      endpoint: '/api/send-email',
      details: { reason: 'Email API rate limit exceeded' }
    });
    return rateLimitResult;
  }

  try {
    const { to, subject, html, text } = await request.json();

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

    // Validate email format
    if (!isValidEmail(to)) {
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
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM_ADDRESS || 'Harthio <no-reply@harthio.com>',
        to: [to],
        subject: subject,
        html: html,
        text: text,
      });

      if (error) {
        console.error('Resend email error:', error);
        throw error;
      }

      console.log('✅ Email sent successfully via Resend:', data?.id);
      return NextResponse.json({ 
        success: true, 
        messageId: data?.id 
      }, {
        headers: getSecurityHeaders()
      });
    } catch (resendError) {
      console.error('Resend email failed:', resendError);
      
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