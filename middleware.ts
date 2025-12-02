import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Middleware should use anon key - RLS policies handle security
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
  
  // Redirect old /admin routes to /admin-v2
  if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin-v2')) {
    const newPath = url.pathname.replace(/^\/admin/, '/admin-v2');
    url.pathname = newPath;
    return NextResponse.redirect(url);
  }
  
  // Security: Protect admin routes - validate token
  if (url.pathname.startsWith('/admin-v2') && url.pathname !== '/admin-v2/login') {
    // Get all possible Supabase auth cookie names
    const allCookies = request.cookies.getAll();
    const authCookie = allCookies.find(cookie => 
      cookie.name.includes('sb-') && cookie.name.includes('auth-token')
    );
    
    const token = authCookie?.value || 
                  request.cookies.get('sb-access-token')?.value || 
                  request.cookies.get('supabase-auth-token')?.value;
    
    if (!token) {
      console.log('[Middleware] No auth token found, redirecting to login');
      url.pathname = '/admin-v2/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Validate token with Supabase
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.log('[Middleware] Token validation failed:', error?.message);
        // Invalid token, redirect to login
        url.pathname = '/admin-v2/login';
        url.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(url);
      }
      
      console.log('[Middleware] User authenticated:', user.id);
    } catch (error) {
      console.log('[Middleware] Token validation error:', error);
      // Token validation failed, redirect to login
      url.pathname = '/admin-v2/login';
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
