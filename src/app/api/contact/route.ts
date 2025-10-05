import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';
import { z } from 'zod';

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

    console.log('📧 Processing contact form submission:', {
      userName,
      userEmail,
      topic,
      messageLength: message.length
    });

    // Send notification to admin (tosin@harthio.com)
    const adminNotificationSent = await emailService.sendContactUsNotification({
      userName,
      userEmail,
      topic,
      message,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://harthio.com'
    });

    // Send auto-reply to user
    const autoReplySent = await emailService.sendContactUsAutoReply(userEmail, {
      userName,
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
    });

  } catch (error) {
    console.error('❌ Contact form API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process your message. Please try again.' 
      },
      { status: 500 }
    );
  }
}