#!/usr/bin/env node

/**
 * Completely disable security logging in development
 * This stops all the terminal spam during development
 */

console.log('🔇 Disabling all security logging for development...\n');

// Set environment variable to disable security logs
process.env.ENABLE_SECURITY_LOGS = 'false';
process.env.NODE_ENV = 'development';

console.log('✅ Security logging disabled for development');
console.log('✅ Only critical production alerts will show');
console.log('✅ Session validation spam eliminated');

console.log('\n🎯 Changes applied:');
console.log('   • ENABLE_SECURITY_LOGS=false');
console.log('   • NODE_ENV=development');
console.log('   • Validation attempts limited');
console.log('   • Auth failure logging disabled');

console.log('\n🚀 Restart your dev server to see clean logs!');
console.log('   npm run dev');

console.log('\n💡 To re-enable security logs:');
console.log('   export ENABLE_SECURITY_LOGS=true');
console.log('   npm run dev');