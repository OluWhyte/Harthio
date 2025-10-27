import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSecurityHeaders, isValidEmail } from '@/lib/security-utils';

// Initialize Resend client only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  // Simplified rate limiting check
  const userAgent = request.headers.get('user-agent') || '';
  if (userAgent.includes('bot') || userAgent.includes('crawler')) {
    return NextResponse.json(
      { success: false, error: 'Rate limited' },
      { status: 429, headers: getSecurityHeaders() }
    );
  }

  try {
    const { to, subject, html, text } = await request.json();

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
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
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    );
  }
}