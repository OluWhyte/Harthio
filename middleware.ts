import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for middleware
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Security: Protect admin routes
  if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
    const token = request.cookies.get('sb-access-token')?.value || 
                  request.cookies.get('supabase-auth-token')?.value;
    
    if (!token) {
      url.pathname = '/admin/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Verify admin role server-side
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        url.pathname = '/admin/login';
        url.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(url);
      }

      // Check admin role
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!adminRole) {
        // Not an admin, redirect to main site
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      // Authentication failed, redirect to login
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