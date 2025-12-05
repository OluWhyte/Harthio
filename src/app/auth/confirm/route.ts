import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/auth/verified'

  console.log('[AUTH CONFIRM] Token hash present:', !!token_hash)
  console.log('[AUTH CONFIRM] Type:', type)

  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      })

      if (error) {
        console.error('[AUTH CONFIRM] Error verifying:', error)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/error?message=${encodeURIComponent(error.message || 'Verification failed. Please try again.')}`
        )
      }

      if (!data.session) {
        console.error('[AUTH CONFIRM] No session created')
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/error?message=${encodeURIComponent('Failed to create session. Please try again.')}`
        )
      }

      console.log('[AUTH CONFIRM] Successfully verified user:', data.user?.email)
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    } catch (error) {
      console.error('[AUTH CONFIRM] Unexpected error:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/error?message=${encodeURIComponent('An unexpected error occurred.')}`
      )
    }
  }

  console.log('[AUTH CONFIRM] Missing token_hash or type')
  return NextResponse.redirect(
    `${requestUrl.origin}/login?message=${encodeURIComponent('Invalid verification link')}`
  )
}
