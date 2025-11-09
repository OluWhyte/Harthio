#!/usr/bin/env node

/**
 * Execute the admin function fix using Supabase service role
 * This script runs the SQL fix while maintaining security
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAIL = 'peterlimited2000@gmail.com';

async function executeSQL(sql, description) {
  console.log(`🔧 ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec', { sql });
    if (error) {
      console.log(`❌ Failed: ${error.message}`);
      return false;
    } else {
      console.log(`✅ Success: ${description}`);
      return true;
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return false;
  }
}

async function runFix() {
  console.log('🚀 Running Admin Function Fix Script\n');
  console.log(`📧 Admin Email: ${ADMIN_EMAIL}`);
  console.log(`🔗 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);

  // Step 1: Fix the is_admin_user function
  const fixFunction = `
    CREATE OR REPLACE FUNCTION public.is_admin_user()
    RETURNS BOOLEAN
    LANGUAGE SQL
    SECURITY DEFINER
    AS $$
      SELECT EXISTS (
        SELECT 1 
        FROM admin_roles ar 
        WHERE ar.user_id = auth.uid()
      );
    $$;
    
    GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
  `;

  await executeSQL(fixFunction, 'Fixing is_admin_user function');

  // Step 2: Test the function
  console.log('\n🧪 Testing admin function...');
  try {
    const { data: functionTest, error: functionError } = await supabase.rpc('is_admin_user');
    if (functionError) {
      console.log('❌ Function test failed:', functionError.message);
    } else {
      console.log(`✅ Function test result: ${functionTest}`);
    }
  } catch (err) {
    console.log('❌ Function test error:', err.message);
  }

  // Step 3: Recreate user_footprints view with proper security
  const createView = `
    DROP VIEW IF EXISTS public.user_footprints;
    
    CREATE VIEW public.user_footprints AS
    SELECT 
      u.id as user_id,
      u.email,
      u.display_name,
      COALESCE(COUNT(DISTINCT us.id), 0) as total_sessions,
      COALESCE(COUNT(DISTINCT us.device_fingerprint), 0) as unique_devices,
      COALESCE(COUNT(DISTINCT us.ip_address), 0) as unique_ip_addresses,
      COALESCE(COUNT(DISTINCT (us.location_info->>'country')), 0) as unique_countries,
      MIN(us.created_at) as first_session,
      MAX(us.last_active) as last_session,
      COALESCE(AVG(us.session_duration_minutes), 0) as avg_session_duration,
      COALESCE(SUM(us.session_duration_minutes), 0) as total_session_time,
      COALESCE(COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '7 days' THEN 1 END), 0) as sessions_last_7_days,
      COALESCE(COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '30 days' THEN 1 END), 0) as sessions_last_30_days,
      '{}'::jsonb as most_used_device,
      '{}'::jsonb as most_common_location,
      CASE 
        WHEN COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) >= 5 THEN 'High'::text
        WHEN COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) >= 2 THEN 'Medium'::text
        ELSE 'Low'::text
      END as engagement_level
    FROM users u
    LEFT JOIN user_sessions us ON u.id = us.user_id
    WHERE EXISTS (
      SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid()
    )
    GROUP BY u.id, u.email, u.display_name;
    
    GRANT SELECT ON public.user_footprints TO authenticated;
  `;

  await executeSQL(createView, 'Recreating user_footprints view with proper security');

  // Step 4: Test the view
  console.log('\n🧪 Testing user_footprints view...');
  try {
    const { data: viewTest, error: viewError } = await supabase
      .from('user_footprints')
      .select('engagement_level')
      .limit(1);
    
    if (viewError) {
      console.log('❌ View test failed:', viewError.message);
    } else {
      console.log('✅ View test successful');
      console.log('📊 Sample data:', viewTest);
    }
  } catch (err) {
    console.log('❌ View test error:', err.message);
  }

  // Step 5: Test the specific query that was failing
  console.log('\n🎯 Testing the specific failing query...');
  try {
    const { data: specificTest, error: specificError } = await supabase
      .from('user_footprints')
      .select('engagement_level')
      .eq('user_id', '3fe8c7ea-15ce-4149-a435-c738ffbecaff');
    
    if (specificError) {
      console.log('❌ Specific query failed:', specificError.message);
    } else {
      console.log('✅ Specific query successful');
      console.log('📊 Result:', specificTest);
    }
  } catch (err) {
    console.log('❌ Specific query error:', err.message);
  }

  // Step 6: Debug information
  console.log('\n🔍 Debug Information...');
  try {
    // Get current user info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (user) {
      console.log(`👤 Current user: ${user.email} (${user.id})`);
    }

    // Check admin roles
    const { data: adminRoles, error: adminError } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', '3fe8c7ea-15ce-4149-a435-c738ffbecaff');
    
    if (!adminError && adminRoles) {
      console.log(`👑 Admin roles for user: ${adminRoles.length} roles found`);
    }

  } catch (err) {
    console.log('❌ Debug info error:', err.message);
  }

  console.log('\n🎉 Fix script completed!');
  console.log('🔄 Please refresh your admin panel to test the fix.');
}

// Run the fix
runFix().catch(console.error);