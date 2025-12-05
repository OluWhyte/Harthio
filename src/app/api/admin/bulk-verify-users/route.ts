import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin endpoint to bulk verify existing users
// This fixes users who can log in but show as unverified in Supabase

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow from admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the requesting user is an admin
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('[BULK VERIFY] Starting bulk verification process...');

    // Get all users from auth.users table who are not verified
    const { data: authUsers, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();

    if (fetchError) {
      console.error('[BULK VERIFY] Error fetching users:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    console.log(`[BULK VERIFY] Found ${authUsers.users.length} total users`);

    // Filter users who can log in but are not verified
    const unverifiedUsers = authUsers.users.filter(user => 
      !user.email_confirmed_at && // Not verified
      user.created_at && // Has account
      !user.banned_until // Not banned
    );

    console.log(`[BULK VERIFY] Found ${unverifiedUsers.length} unverified users to fix`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Bulk verify users
    for (const user of unverifiedUsers) {
      try {
        // Update user to be verified
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            email_confirm: true
          }
        );

        if (updateError) {
          console.error(`[BULK VERIFY] Error verifying user ${user.email}:`, updateError);
          errorCount++;
          errors.push(`${user.email}: ${updateError.message}`);
        } else {
          console.log(`[BULK VERIFY] Successfully verified: ${user.email}`);
          successCount++;
        }
      } catch (error) {
        console.error(`[BULK VERIFY] Unexpected error for user ${user.email}:`, error);
        errorCount++;
        errors.push(`${user.email}: Unexpected error`);
      }
    }

    const result = {
      success: true,
      message: `Bulk verification completed`,
      stats: {
        totalUsers: authUsers.users.length,
        unverifiedFound: unverifiedUsers.length,
        successfullyVerified: successCount,
        errors: errorCount
      },
      errors: errors.slice(0, 10) // Limit error details
    };

    console.log('[BULK VERIFY] Process completed:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[BULK VERIFY] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to complete bulk verification'
      },
      { status: 500 }
    );
  }
}