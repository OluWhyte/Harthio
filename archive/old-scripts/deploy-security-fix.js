#!/usr/bin/env node

/**
 * Deploy Security Fix for user_footprints view
 * Applies the security fix to restrict access to admin users only
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

async function deploySecurityFix() {
  console.log('🔒 Deploying Security Fix for user_footprints view\n');
  
  // Check if we have the required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Missing required environment variables:');
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${serviceKey ? '✅' : '❌'}`);
    console.log('\n💡 Please ensure your .env.local file has these variables.');
    return;
  }
  
  // Read the SQL file
  const sqlFilePath = path.join(__dirname, '..', 'database', 'security-fixes', 'fix-user-footprints-security.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.log('❌ SQL file not found:', sqlFilePath);
    return;
  }
  
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  console.log('📋 Security Fix Summary:');
  console.log('   • Remove SECURITY DEFINER from user_footprints view');
  console.log('   • Enable Row Level Security (RLS)');
  console.log('   • Add admin-only access policy');
  console.log('   • Restrict sensitive user data to admins only\n');
  
  console.log('📝 Manual Steps Required:');
  console.log('   1. Go to your Supabase Dashboard');
  console.log(`   2. Navigate to: ${supabaseUrl.replace('//', '//').replace('.co', '.co/dashboard')}`);
  console.log('   3. Go to SQL Editor');
  console.log('   4. Copy and paste the SQL from: database/security-fixes/fix-user-footprints-security.sql');
  console.log('   5. Run the SQL script');
  console.log('   6. Verify the fix using the test queries in the script\n');
  
  console.log('🔍 What This Fix Does:');
  console.log('   ✅ Removes SECURITY DEFINER (security vulnerability)');
  console.log('   ✅ Adds Row Level Security policies');
  console.log('   ✅ Restricts user_footprints to admin users only');
  console.log('   ✅ Prevents regular users from seeing sensitive analytics\n');
  
  console.log('⚠️  Important Notes:');
  console.log('   • This will NOT break your app');
  console.log('   • Only admin users will be able to access user_footprints');
  console.log('   • Regular users will get empty results (which is correct)');
  console.log('   • Your admin analytics will continue to work normally\n');
  
  console.log('🎯 After applying the fix:');
  console.log('   • Test admin access: Should work normally');
  console.log('   • Test regular user access: Should be blocked');
  console.log('   • Run: npm run test:supabase to verify connection\n');
  
  console.log('📄 SQL File Location:');
  console.log(`   ${sqlFilePath}\n`);
  
  // Show a preview of the SQL
  const lines = sqlContent.split('\n');
  const previewLines = lines.slice(0, 20);
  console.log('📖 SQL Preview (first 20 lines):');
  console.log('   ' + previewLines.join('\n   '));
  if (lines.length > 20) {
    console.log(`   ... (${lines.length - 20} more lines)`);
  }
}

deploySecurityFix().catch(console.error);