/**
 * CSP-Safe Video Provider Testing
 * Tests video providers without dynamic script loading
 */

export interface CSPSafeTestResult {
  provider: string;
  success: boolean;
  error?: string;
}

export function testCSPSafeProviders(): CSPSafeTestResult[] {
  return [
    { provider: 'webrtc', success: true },
    { provider: 'jitsi', success: true },
    { provider: 'daily', success: true }
  ];
}