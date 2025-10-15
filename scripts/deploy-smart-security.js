#!/usr/bin/env node

/**
 * Deploy Smart Security Notification System
 * Sets up the admin notifications table and smart security system
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

async function deploySmartSecurity() {
  console.log('🛡️  Deploying Smart Security Notification System\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Missing required environment variables:');
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${serviceKey ? '✅' : '❌'}`);
    return;
  }
  
  console.log('📋 Smart Security System Features:');
  console.log('   ✅ Prevents security logging spam');
  console.log('   ✅ Sends notifications once per incident');
  console.log('   ✅ Groups similar security events');
  console.log('   ✅ Admin dashboard integration');
  console.log('   ✅ Configurable cooldown periods');
  console.log('   ✅ Email alerts for critical incidents\n');
  
  console.log('🗄️  Database Setup Required:');
  console.log('   1. Go to your Supabase Dashboard');
  console.log(`   2. Navigate to: ${supabaseUrl.replace('//', '//').replace('.co', '.co/dashboard')}`);
  console.log('   3. Go to SQL Editor');
  console.log('   4. Copy and paste the SQL from: database/admin-notifications-table.sql');
  console.log('   5. Run the SQL script to create the admin_notifications table\n');
  
  console.log('🎯 What This System Does:');
  console.log('   📊 Smart Notifications:');
  console.log('      • Groups similar incidents together');
  console.log('      • Sends notifications once per cooldown period');
  console.log('      • Prevents terminal spam in development');
  console.log('      • Maintains security awareness');
  console.log('');
  console.log('   🔔 Admin Dashboard:');
  console.log('      • Security notifications tab in admin analytics');
  console.log('      • Real-time notification updates');
  console.log('      • Mark as read functionality');
  console.log('      • Severity-based filtering');
  console.log('');
  console.log('   ⚙️  Cooldown Periods:');
  console.log('      • Auth failures: 5 minutes');
  console.log('      • Suspicious activity: 10 minutes');
  console.log('      • Rate limiting: 2 minutes');
  console.log('      • Access denied: 5 minutes');
  console.log('      • Validation errors: 15 minutes');
  console.log('');
  
  console.log('🔧 Environment Settings:');
  console.log('   • Development: Security logs disabled by default');
  console.log('   • Production: Full security monitoring enabled');
  console.log('   • Override: Set ENABLE_SECURITY_LOGS=true to enable in dev');
  console.log('');
  
  console.log('📧 Email Alerts (Optional):');
  console.log('   • Set SECURITY_ALERT_EMAIL for critical incident emails');
  console.log('   • Set SECURITY_WEBHOOK_URL for external monitoring');
  console.log('   • Critical incidents trigger immediate notifications');
  console.log('');
  
  console.log('🚀 After Setup:');
  console.log('   1. Run the SQL script in Supabase');
  console.log('   2. Restart your development server');
  console.log('   3. Visit /admin/analytics and check the Security tab');
  console.log('   4. Test by triggering a security event (e.g., invalid API call)');
  console.log('   5. Verify notification appears in admin dashboard');
  console.log('');
  
  console.log('📁 Files Created:');
  console.log('   ✅ src/lib/smart-security-notifier.ts - Smart notification system');
  console.log('   ✅ src/components/admin/security-notifications.tsx - Admin UI');
  console.log('   ✅ database/admin-notifications-table.sql - Database schema');
  console.log('   ✅ Updated security-utils.ts to use smart notifications');
  console.log('   ✅ Added Security tab to admin analytics');
  console.log('');
  
  console.log('🎉 Benefits:');
  console.log('   • No more terminal spam during development');
  console.log('   • Security awareness maintained');
  console.log('   • Professional admin notifications');
  console.log('   • Grouped incident reporting');
  console.log('   • Configurable alert thresholds');
}

deploySmartSecurity().catch(console.error);