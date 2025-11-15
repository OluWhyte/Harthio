#!/usr/bin/env node

/**
 * Environment Checker
 * Helps verify which environment you're currently using
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Harthio Environment Check\n');
console.log('═'.repeat(50));

// Check if .env.local exists
const envLocalPath = path.join(process.cwd(), '.env.local');
const hasEnvLocal = fs.existsSync(envLocalPath);

console.log('\n📁 Environment Files:');
console.log(`   .env.local: ${hasEnvLocal ? '✅ Found' : '❌ Not found'}`);

if (!hasEnvLocal) {
  console.log('\n⚠️  Warning: No .env.local file found!');
  console.log('   Create one by copying .env.development.template:');
  console.log('   cp .env.development.template .env.local\n');
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: envLocalPath });

// Check key variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const nodeEnv = process.env.NODE_ENV || 'development';

console.log('\n🌍 Current Environment:');
console.log(`   NODE_ENV: ${nodeEnv}`);
console.log(`   App URL: ${appUrl || 'Not set'}`);

if (supabaseUrl) {
  // Extract project ID from URL
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  console.log(`   Supabase Project: ${projectId || 'Unknown'}`);
  console.log(`   Supabase URL: ${supabaseUrl}`);
  
  // Determine environment based on URL
  const isLocalhost = appUrl?.includes('localhost');
  const isProduction = appUrl?.includes('harthio.com');
  const isVercelPreview = appUrl?.includes('vercel.app');
  
  console.log('\n🎯 Detected Environment:');
  if (isLocalhost) {
    console.log('   ✅ LOCAL DEVELOPMENT');
  } else if (isProduction) {
    console.log('   🚀 PRODUCTION');
  } else if (isVercelPreview) {
    console.log('   🔍 PREVIEW/STAGING');
  } else {
    console.log('   ❓ UNKNOWN');
  }
  
  // Safety warnings
  if (isLocalhost && supabaseUrl.includes('prod')) {
    console.log('\n⚠️  WARNING: Local development pointing to production database!');
    console.log('   This is dangerous. Use development database instead.');
  }
  
  if (isProduction && supabaseUrl.includes('dev')) {
    console.log('\n⚠️  WARNING: Production pointing to development database!');
    console.log('   This should never happen. Check your Vercel environment variables.');
  }
  
} else {
  console.log('   ❌ Supabase URL not configured');
}

// Check other important variables
console.log('\n🔑 Configuration Status:');
const checks = [
  { name: 'Supabase URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
  { name: 'Supabase Anon Key', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
  { name: 'Service Role Key', value: process.env.SUPABASE_SERVICE_ROLE_KEY },
  { name: 'Resend API Key', value: process.env.RESEND_API_KEY },
  { name: 'TURN Server', value: process.env.NEXT_PUBLIC_METERED_DOMAIN },
];

checks.forEach(check => {
  const status = check.value ? '✅' : '❌';
  const display = check.value ? '(configured)' : '(missing)';
  console.log(`   ${status} ${check.name}: ${display}`);
});

console.log('\n' + '═'.repeat(50));
console.log('\n💡 Tips:');
console.log('   - Use .env.local for local development');
console.log('   - Never commit .env.local to git');
console.log('   - Use Vercel dashboard for production variables');
console.log('   - Keep dev and prod databases separate\n');
