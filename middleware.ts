import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for middleware
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  // Handle admin subdomain routing
  if (hostname.startsWith('admin.')) {
    // Rewrite admin.harthio.com/* to /admin/*
    // e.g., admin.harthio.com/login -> /admin/login
    if (!url.pathname.startsWith('/admin')) {
      const rewriteUrl = url.clone();
      rewriteUrl.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }
  }
  
  // Security: Protect admin routes - just check if logged in
  // Admin role check happens in the pages themselves via AdminAuthService
  if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
    const token = request.cookies.get('sb-access-token')?.value || 
                  request.cookies.get('supabase-auth-token')?.value;
    
    if (!token) {
      url.pathname = '/admin/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
