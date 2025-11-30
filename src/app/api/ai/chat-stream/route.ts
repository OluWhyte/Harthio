import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateCSRFToken } from '@/lib/csrf-middleware';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const GROQ_API_KEY = process.env.GROQ_API_KEY_DEV || process.env.GROQ_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY_PROD || process.env.DEEPSEEK_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfValid = validateCSRFToken(request);
    if (!csrfValid) {
      return new Response('CSRF validation failed', { status: 403 });
    }

    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { messages, provider = 'deepseek' } = body;

    // Select API based on provider
    const apiUrl = provider === 'groq' ? GROQ_API_URL : DEEPSEEK_API_URL;
    const apiKey = provider === 'groq' ? GROQ_API_KEY : DEEPSEEK_API_KEY;
    const model = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'deepseek-chat';

    if (!apiKey) {
      return new Response('AI service not configured', { status: 500 });
    }

    // Call AI API with streaming
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: true,
      }),
    });

    if (!response.ok) {
      return new Response('AI service error', { status: response.status });
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Streaming error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
