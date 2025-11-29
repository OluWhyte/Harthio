// Admin authentication helper
// Uses service role to avoid RLS recursion

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('admin_roles')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Admin check error:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Admin check exception:', error);
    return false;
  }
}
