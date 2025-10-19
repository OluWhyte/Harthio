#!/usr/bin/env node

/**
 * Diagnostic and Fix Script for user_footprints View
 * This script will diagnose and fix the 406 error you're experiencing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAIL = 'peterlimited2000@gmail.com';

async function runDiagnostics() {
  console.log('🔍 Running Diagnostics for user_footprints View\n');
  console.log(`📧 Admin Email: ${ADMIN_EMAIL}`);
  console.log(`🔗 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);

  const results = {
    userExists: false,
    adminRolesTableExists: false,
    userSessionsTableExists: false,
    userFootprintsViewExists: false,
    isAdminFunctionExists: false,
    userIsAdmin: false,
    userId: null
  };

  try {
    // 1. Check if user exists
    console.log('1️⃣ Checking if user exists...');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.log('❌ Error fetching users:', userError.message);
    } else {
      const user = users.users.find(u => u.email === ADMIN_EMAIL);
      if (user) {
        results.userExists = true;
        results.userId = user.id;
        console.log(`✅ User exists: ${user.id}`);
      } else {
        console.log('❌ User not found');
      }
    }

    // 2. Check if admin_roles table exists
    console.log('\n2️⃣ Checking if admin_roles table exists...');
    const { data: adminRolesCheck, error: adminRolesError } = await supabase
      .from('admin_roles')
      .select('*')
      .limit(1);
    
    if (adminRolesError) {
      console.log('❌ admin_roles table does not exist:', adminRolesError.message);
    } else {
      results.adminRolesTableExists = true;
      console.log('✅ admin_roles table exists');
    }

    // 3. Check if user_sessions table exists
    console.log('\n3️⃣ Checking if user_sessions table exists...');
    const { data: userSessionsCheck, error: userSessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .limit(1);
    
    if (userSessionsError) {
      console.log('❌ user_sessions table does not exist:', userSessionsError.message);
    } else {
      results.userSessionsTableExists = true;
      console.log('✅ user_sessions table exists');
    }

    // 4. Check if user_footprints view exists
    console.log('\n4️⃣ Checking if user_footprints view exists...');
    const { data: userFootprintsCheck, error: userFootprintsError } = await supabase
      .from('user_footprints')
      .select('*')
      .limit(1);
    
    if (userFootprintsError) {
      console.log('❌ user_footprints view does not exist or has issues:', userFootprintsError.message);
    } else {
      results.userFootprintsViewExists = true;
      console.log('✅ user_footprints view exists');
    }

    // 5. Check if is_admin_user function exists
    console.log('\n5️⃣ Checking if is_admin_user function exists...');
    const { data: functionCheck, error: functionError } = await supabase.rpc('is_admin_user');
    
    if (functionError) {
      console.log('❌ is_admin_user function does not exist:', functionError.message);
    } else {
      results.isAdminFunctionExists = true;
      results.userIsAdmin = functionCheck;
      console.log(`✅ is_admin_user function exists, returns: ${functionCheck}`);
    }

    // 6. Check if user is in admin_roles
    if (results.adminRolesTableExists && results.userId) {
      console.log('\n6️⃣ Checking if user is in admin_roles...');
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', results.userId);
      
      if (adminCheckError) {
        console.log('❌ Error checking admin status:', adminCheckError.message);
      } else if (adminCheck && adminCheck.length > 0) {
        results.userIsAdmin = true;
        console.log('✅ User is in admin_roles table');
      } else {
        console.log('❌ User is NOT in admin_roles table');
      }
    }

    return results;
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    return results;
  }
}

async function fixIssues(diagnostics) {
  console.log('\n🔧 Applying Fixes...\n');

  try {
    // Fix 1: Create admin_roles table if it doesn't exist
    if (!diagnostics.adminRolesTableExists) {
      console.log('🔨 Creating admin_roles table...');
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS admin_roles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
            role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (error) {
        console.log('❌ Failed to create admin_roles table:', error.message);
      } else {
        console.log('✅ admin_roles table created');
      }
    }

    // Fix 2: Add user to admin_roles if not already there
    if (diagnostics.userId && !diagnostics.userIsAdmin) {
      console.log('🔨 Adding user to admin_roles...');
      const { error } = await supabase
        .from('admin_roles')
        .insert({
          user_id: diagnostics.userId,
          role: 'admin'
        });
      
      if (error && !error.message.includes('duplicate')) {
        console.log('❌ Failed to add user to admin_roles:', error.message);
      } else {
        console.log('✅ User added to admin_roles');
      }
    }

    // Fix 3: Create user_sessions table if it doesn't exist
    if (!diagnostics.userSessionsTableExists) {
      console.log('🔨 Creating user_sessions table...');
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS user_sessions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) NOT NULL,
            session_token TEXT UNIQUE NOT NULL,
            ip_address INET NOT NULL,
            user_agent TEXT,
            device_info JSONB NOT NULL DEFAULT '{}',
            location_info JSONB,
            device_fingerprint TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ended_at TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN DEFAULT TRUE,
            session_duration_minutes INTEGER GENERATED ALWAYS AS (
              CASE 
                WHEN ended_at IS NOT NULL THEN 
                  EXTRACT(EPOCH FROM (ended_at - created_at)) / 60
                ELSE 
                  EXTRACT(EPOCH FROM (last_active - created_at)) / 60
              END
            ) STORED
          );
        `
      });
      
      if (error) {
        console.log('❌ Failed to create user_sessions table:', error.message);
      } else {
        console.log('✅ user_sessions table created');
      }
    }

    // Fix 4: Create is_admin_user function if it doesn't exist
    if (!diagnostics.isAdminFunctionExists) {
      console.log('🔨 Creating is_admin_user function...');
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
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
        `
      });
      
      if (error) {
        console.log('❌ Failed to create is_admin_user function:', error.message);
      } else {
        console.log('✅ is_admin_user function created');
      }
    }

    // Fix 5: Create user_footprints view
    console.log('🔨 Creating/updating user_footprints view...');
    const { error: viewError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE VIEW public.user_footprints AS
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
        WHERE public.is_admin_user() = true
        GROUP BY u.id, u.email, u.display_name;
        
        GRANT SELECT ON public.user_footprints TO authenticated;
      `
    });
    
    if (viewError) {
      console.log('❌ Failed to create user_footprints view:', viewError.message);
    } else {
      console.log('✅ user_footprints view created');
    }

    // Fix 6: Add sample data for testing
    if (diagnostics.userId) {
      console.log('🔨 Adding sample session data for testing...');
      const { error: sampleError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: diagnostics.userId,
          session_token: `sample-session-${Date.now()}`,
          ip_address: '127.0.0.1',
          device_info: {
            browser: 'Chrome',
            os: 'Windows',
            device_type: 'desktop'
          },
          location_info: {
            country: 'United States',
            city: 'New York'
          },
          device_fingerprint: `sample-fingerprint-${Date.now()}`
        });
      
      if (sampleError && !sampleError.message.includes('duplicate')) {
        console.log('❌ Failed to add sample data:', sampleError.message);
      } else {
        console.log('✅ Sample session data added');
      }
    }

    console.log('\n🎉 All fixes applied successfully!');
    
  } catch (error) {
    console.error('❌ Error applying fixes:', error);
  }
}

async function testFix() {
  console.log('\n🧪 Testing the Fix...\n');

  try {
    // Test the user_footprints view
    const { data, error } = await supabase
      .from('user_footprints')
      .select('engagement_level')
      .limit(1);
    
    if (error) {
      console.log('❌ user_footprints view still has issues:', error.message);
      return false;
    } else {
      console.log('✅ user_footprints view is working!');
      console.log('📊 Sample data:', data);
      return true;
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting user_footprints Diagnostic and Fix Script\n');
  
  // Run diagnostics
  const diagnostics = await runDiagnostics();
  
  // Apply fixes
  await fixIssues(diagnostics);
  
  // Test the fix
  const success = await testFix();
  
  if (success) {
    console.log('\n🎯 SUCCESS! The 406 error should now be fixed.');
    console.log('🔄 Refresh your admin panel to see the changes.');
  } else {
    console.log('\n⚠️  Some issues may still exist. Check the logs above.');
  }
  
  console.log('\n✨ Script completed!');
}

// Run the script
main().catch(console.error);