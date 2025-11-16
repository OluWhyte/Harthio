import { NextRequest, NextResponse } from 'next/server';
import { strictRateLimit } from '@/lib/rate-limit';
import { getSecurityHeaders, logSecurityEvent, sanitizeError } from '@/lib/security-utils';
import { InputSanitizer } from '@/lib/security/owasp-security-service';

export async function POST(request: NextRequest) {
  // Apply strict rate limiting (3 requests per 15 minutes)
  const rateLimitResult = strictRateLimit(request);
  if (rateLimitResult) {
    logSecurityEvent({
      type: 'rate_limit',
      ip: request.ip || 'unknown',
      endpoint: '/api/contact',
      details: { reason: 'Contact form rate limit exceeded' }
    });
    return rateLimitResult;
  }

  try {
    const body = await request.json();
    const { name, email, subject, message } = body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      logSecurityEvent({
        type: 'validation_error',
        ip: request.ip || 'unknown',
        endpoint: '/api/contact',
        details: { reason: 'Missing required fields' }
      });
      
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate email format
    if (!InputSanitizer.isValidEmail(email)) {
      logSecurityEvent({
        type: 'validation_error',
        ip: request.ip || 'unknown',
        endpoint: '/api/contact',
        details: { reason: 'Invalid email format', email }
      });
      
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate field lengths
    if (name.length > 100 || subject.length > 200 || message.length > 2000) {
      logSecurityEvent({
        type: 'validation_error',
        ip: request.ip || 'unknown',
        endpoint: '/api/contact',
        details: { reason: 'Field length exceeded' }
      });
      
      return NextResponse.json(
        { success: false, error: 'Field length exceeded limits' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      name: InputSanitizer.sanitizeInput(name),
      email: email.trim().toLowerCase(),
      subject: InputSanitizer.sanitizeInput(subject),
      message: InputSanitizer.sanitizeInput(message),
      ip: request.ip || 'unknown',
      timestamp: new Date().toISOString()
    };

    // Log contact form submission
    console.log('📧 Contact form submission:', {
      from: sanitizedData.email,
      subject: sanitizedData.subject,
      ip: sanitizedData.ip
    });

    // TODO: Send email notification to admin
    // For now, just log it securely
    
    logSecurityEvent({
      type: 'contact_form',
      ip: request.ip || 'unknown',
      endpoint: '/api/contact',
      details: { 
        email: sanitizedData.email,
        subject: sanitizedData.subject
      }
    });

    return NextResponse.json(
      { success: true, message: 'Thank you for contacting us. We will respond shortly.' },
      { headers: getSecurityHeaders() }
    );
    
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
    
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit contact form' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
