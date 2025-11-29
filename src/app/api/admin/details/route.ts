import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ isAdmin: false, error: 'No user ID provided' }, { status: 400 });
    }

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First check if user is admin (same logic as check API)
    const { data: adminRole, error: roleError } = await supabase
      .from('admin_roles')
      .select('id, is_active, role, permissions')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (roleError) {
      if (roleError.code === 'PGRST116') {
        // No rows returned - not an admin
        return NextResponse.json({ isAdmin: false, error: 'User is not an admin' });
      }
      console.error('Admin role check error:', roleError);
      return NextResponse.json({ isAdmin: false, error: roleError.message }, { status: 500 });
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, display_name, first_name, last_name')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('User data error:', userError);
      return NextResponse.json({ isAdmin: false, error: 'Failed to get user data' }, { status: 500 });
    }

    const displayName = userData.display_name || 
                       (userData.first_name && userData.last_name ? `${userData.first_name} ${userData.last_name}` : null) ||
                       userData.email?.split('@')[0];

    return NextResponse.json({
      isAdmin: true,
      role: adminRole.role,
      permissions: adminRole.permissions || [],
      display_name: displayName,
      email: userData.email
    });

  } catch (error) {
    console.error('Admin details exception:', error);
    return NextResponse.json({ isAdmin: false, error: 'Internal server error' }, { status: 500 });
  }
}