import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error_code = requestUrl.searchParams.get('error_code')
  const error_description = requestUrl.searchParams.get('error_description')
  
  // Check for errors from Supabase
  if (error_code) {
    console.error('[AUTH CALLBACK] Supabase error:', error_code, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/error?message=${encodeURIComponent(error_description || 'Authentication error occurred')}`
    )
  }

  const next = requestUrl.searchParams.get('next') ?? '/auth/verified'

  console.log('[AUTH CALLBACK] Request URL:', requestUrl.toString())
  console.log('[AUTH CALLBACK] Code present:', !!code)
  console.log('[AUTH CALLBACK] Next URL:', next)

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[AUTH CALLBACK] Error exchanging code for session:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=${encodeURIComponent(error.message || 'Verification failed. Please try again.')}`)
      }

      if (!data.session) {
        console.error('[AUTH CALLBACK] No session created')
        return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=${encodeURIComponent('Failed to create session. Please try again.')}`)
      }

      console.log('[AUTH CALLBACK] Successfully verified user:', data.user?.email)
      // Redirect to verification success page (keep user signed in)
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    } catch (error) {
      console.error('[AUTH CALLBACK] Unexpected error during verification:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=${encodeURIComponent('An unexpected error occurred.')}`)
    }
  }

  // If no code, redirect to login with message
  console.log('[AUTH CALLBACK] No code parameter found')
  return NextResponse.redirect(`${requestUrl.origin}/login?message=${encodeURIComponent('Invalid verification link')}`)
}