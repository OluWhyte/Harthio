import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/auth/verified'

  console.log('[AUTH CALLBACK] Request URL:', requestUrl.toString())
  console.log('[AUTH CALLBACK] Code present:', !!code)
  console.log('[AUTH CALLBACK] Token hash present:', !!token_hash)
  console.log('[AUTH CALLBACK] Type:', type)
  console.log('[AUTH CALLBACK] Next URL:', next)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Handle PKCE flow (code parameter)
  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[AUTH CALLBACK] Error exchanging code for session:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=${encodeURIComponent('Verification failed. Please try again.')}`)
      }

      console.log('[AUTH CALLBACK] Successfully exchanged code for session')
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    } catch (error) {
      console.error('[AUTH CALLBACK] Unexpected error during code exchange:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=${encodeURIComponent('An unexpected error occurred.')}`)
    }
  }

  // Handle email verification with token_hash (legacy flow)
  if (token_hash && type) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      })
      
      if (error) {
        console.error('[AUTH CALLBACK] Error verifying OTP:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=${encodeURIComponent('Verification failed. Please try again.')}`)
      }

      console.log('[AUTH CALLBACK] Successfully verified OTP')
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    } catch (error) {
      console.error('[AUTH CALLBACK] Unexpected error during OTP verification:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=${encodeURIComponent('An unexpected error occurred.')}`)
    }
  }

  // If no code or token_hash, redirect to login
  console.log('[AUTH CALLBACK] No code or token_hash found, redirecting to login')
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}