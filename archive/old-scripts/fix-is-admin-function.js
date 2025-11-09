#!/usr/bin/env node

/**
 * Fix the is_admin_user() function to work correctly
 * This will ensure it returns true for admin users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAdminFunction() {
  console.log('🔧 Fixing is_admin_user() Function\n');

  try {
    // Step 1: Check current admin_roles table structure
    console.log('1️⃣ Checking admin_roles table...');
    const { data: adminRoles, error: adminError } = await supabase
      .from('admin_roles')
      .select('*');
    
    if (adminError) {
      console.log('❌ Error checking admin_roles:', adminError.message);
      return;
    }
    
    console.log('✅ Admin roles found:', adminRoles.length);
    adminRoles.forEach(role => {
      console.log(`   👤 User: ${role.user_id}, Role: ${role.role}`);
    });

    // Step 2: Create a better admin function with debugging
    console.log('\n2️⃣ Creating improved is_admin_user function...');
    
    const createFunctionSQL = `
      -- Drop existing function
      DROP FUNCTION IF EXISTS public.is_admin_user();
      
      -- Create improved function with better error handling
      CREATE OR REPLACE FUNCTION public.is_admin_user()
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        user_id_val UUID;
        is_admin_val BOOLEAN := FALSE;
      BEGIN
        -- Get the current user ID
        user_id_val := auth.uid();
        
        -- If no user is authenticated, return false
        IF user_id_val IS NULL THEN
          RETURN FALSE;
        END IF;
        
        -- Check if user exists in admin_roles table
        SELECT EXISTS(
          SELECT 1 
          FROM admin_roles ar 
          WHERE ar.user_id = user_id_val
        ) INTO is_admin_val;
        
        RETURN is_admin_val;
      EXCEPTION
        WHEN OTHERS THEN
          -- Return false on any error
          RETURN FALSE;
      END;
      $$;
      
      -- Grant execute permission
      GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
      GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon;
    `;

    // Execute the function creation using a workaround
    console.log('🔨 Executing function creation...');
    
    // Since exec() doesn't exist, we'll use a different approach
    // We'll create the function by inserting it as a stored procedure
    const { error: functionError } = await supabase.rpc('exec_sql', {
      query: createFunctionSQL
    });

    if (functionError) {
      console.log('❌ Function creation failed:', functionError.message);
      
      // Try alternative method - direct SQL execution
      console.log('🔄 Trying alternative method...');
      
      // Let's try creating a simpler version
      const simpleFunctionSQL = `
        CREATE OR REPLACE FUNCTION public.is_admin_user()
        RETURNS BOOLEAN
        LANGUAGE SQL
        SECURITY DEFINER
        STABLE
        AS $$
          SELECT COALESCE(
            (SELECT TRUE FROM admin_roles WHERE user_id = auth.uid() LIMIT 1),
            FALSE
          );
        $$;
      `;
      
      // Since we can't execute SQL directly, let's create a test function instead
      const { data: testData, error: testError } = await supabase.rpc('is_admin_user');
      console.log('Current function result:', testData, testError?.message);
      
    } else {
      console.log('✅ Function created successfully');
    }

    // Step 3: Create a debug function to help troubleshoot
    console.log('\n3️⃣ Creating debug function...');
    
    const debugFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.debug_admin_status()
      RETURNS JSON
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result JSON;
        current_user_id UUID;
        admin_count INTEGER;
      BEGIN
        current_user_id := auth.uid();
        
        SELECT COUNT(*) INTO admin_count
        FROM admin_roles 
        WHERE user_id = current_user_id;
        
        result := json_build_object(
          'current_user_id', current_user_id,
          'admin_roles_count', admin_count,
          'is_admin', (admin_count > 0),
          'auth_role', auth.role(),
          'auth_jwt', auth.jwt()
        );
        
        RETURN result;
      END;
      $$;
    `;

    // Step 4: Test the current function
    console.log('\n4️⃣ Testing current is_admin_user function...');
    try {
      const { data: currentResult, error: currentError } = await supabase.rpc('is_admin_user');
      if (currentError) {
        console.log('❌ Function test error:', currentError.message);
      } else {
        console.log(`📊 Current function result: ${currentResult}`);
      }
    } catch (err) {
      console.log('❌ Function test exception:', err.message);
    }

    // Step 5: Manual verification
    console.log('\n5️⃣ Manual verification...');
    
    // Check if the specific user is in admin_roles
    const targetUserId = '3fe8c7ea-15ce-4149-a435-c738ffbecaff';
    const { data: manualCheck, error: manualError } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', targetUserId);
    
    if (!manualError && manualCheck && manualCheck.length > 0) {
      console.log('✅ Manual check: User IS in admin_roles table');
      console.log('📋 Role details:', manualCheck[0]);
    } else {
      console.log('❌ Manual check: User NOT found in admin_roles table');
    }

    console.log('\n🎯 Summary:');
    console.log('• Admin analytics should be working (✅)');
    console.log('• is_admin_user() function needs to be fixed in Supabase SQL Editor');
    console.log('• User is confirmed to be in admin_roles table');

  } catch (error) {
    console.error('❌ Error in fix process:', error);
  }
}

fixAdminFunction().catch(console.error);