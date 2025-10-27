/**
 * Daily.co Integration Test
 * Quick verification that the API key works and rooms can be created
 */

import { DailyService } from './daily-service';

export async function testDailyIntegration(): Promise<boolean> {
  const apiKey = process.env.DAILY_API_KEY;
  
  if (!apiKey) {
    console.log('❌ Daily.co API key not found');
    return false;
  }

  try {
    // Test room creation
    console.log('🧪 Testing Daily.co room creation...');
    const roomUrl = await DailyService.createTemporaryRoom('test-integration', apiKey);
    
    if (roomUrl.includes('daily.co')) {
      console.log('✅ Daily.co integration working');
      console.log('🔗 Test room URL:', roomUrl);
      
      // Test room listing
      const rooms = await DailyService.listRooms(apiKey);
      console.log(`📋 Found ${rooms.length} existing rooms`);
      
      return true;
    } else {
      console.log('❌ Failed to create Daily.co room');
      return false;
    }
  } catch (error) {
    console.error('❌ Daily.co integration test failed:', error);
    return false;
  }
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).testDaily = testDailyIntegration;
}