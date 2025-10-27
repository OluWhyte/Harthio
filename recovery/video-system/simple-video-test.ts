/**
 * Simple Video Provider Testing
 * Test one provider at a time to isolate issues
 */

export type SimpleVideoProvider = 'daily' | 'jitsi-public' | 'jitsi-self' | 'webrtc';

export interface SimpleTestConfig {
  sessionId: string;
  displayName: string;
  containerId: string;
}

export interface SimpleTestCallbacks {
  onSuccess: (provider: SimpleVideoProvider) => void;
  onError: (provider: SimpleVideoProvider, error: string) => void;
  onProgress: (message: string) => void;
}

export class SimpleVideoTester {
  private config: SimpleTestConfig;
  private callbacks: SimpleTestCallbacks;
  private currentTest: SimpleVideoProvider | null = null;

  constructor(config: SimpleTestConfig, callbacks: SimpleTestCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  async testDaily(): Promise<boolean> {
    this.currentTest = 'daily';
    this.callbacks.onProgress('Testing Daily.co...');

    try {
      // Step 1: Load Daily library
      this.callbacks.onProgress('Loading Daily.co library...');
      await this.loadDailyLibrary();

      // Step 2: Check API key
      const apiKey = process.env.NEXT_PUBLIC_DAILY_API_KEY;
      if (!apiKey) {
        throw new Error('Daily.co API key not found in environment');
      }
      this.callbacks.onProgress('API key found ✓');

      // Step 3: Test API connection
      this.callbacks.onProgress('Testing Daily.co API connection...');
      const roomUrl = await this.testDailyAPI(apiKey);
      this.callbacks.onProgress(`Room created: ${roomUrl} ✓`);

      // Step 4: Test iframe creation
      this.callbacks.onProgress('Creating Daily.co iframe...');
      await this.testDailyIframe(roomUrl);
      this.callbacks.onProgress('Daily.co iframe created ✓');

      this.callbacks.onSuccess('daily');
      return true;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.callbacks.onError('daily', errorMsg);
      return false;
    }
  }

  async testJitsiPublic(): Promise<boolean> {
    this.currentTest = 'jitsi-public';
    this.callbacks.onProgress('Testing Jitsi Public...');

    try {
      // Step 1: Load Jitsi library
      this.callbacks.onProgress('Loading Jitsi Meet library...');
      await this.loadJitsiLibrary('meet.jit.si');

      // Step 2: Test API creation
      this.callbacks.onProgress('Creating Jitsi Meet API...');
      await this.testJitsiAPI('meet.jit.si');
      this.callbacks.onProgress('Jitsi Public API created ✓');

      this.callbacks.onSuccess('jitsi-public');
      return true;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.callbacks.onError('jitsi-public', errorMsg);
      return false;
    }
  }

  async testJitsiSelf(): Promise<boolean> {
    this.currentTest = 'jitsi-self';
    this.callbacks.onProgress('Testing Jitsi Self-hosted...');

    try {
      const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'session.harthio.com';
      
      // Step 1: Load Jitsi library from custom domain
      this.callbacks.onProgress(`Loading Jitsi library from ${domain}...`);
      await this.loadJitsiLibrary(domain);

      // Step 2: Test API creation
      this.callbacks.onProgress('Creating Jitsi Self-hosted API...');
      await this.testJitsiAPI(domain);
      this.callbacks.onProgress('Jitsi Self-hosted API created ✓');

      this.callbacks.onSuccess('jitsi-self');
      return true;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.callbacks.onError('jitsi-self', errorMsg);
      return false;
    }
  }

  async testWebRTC(): Promise<boolean> {
    this.currentTest = 'webrtc';
    this.callbacks.onProgress('Testing WebRTC...');

    try {
      // Step 1: Test getUserMedia
      this.callbacks.onProgress('Testing camera/microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop()); // Clean up
      this.callbacks.onProgress('Camera/microphone access ✓');

      // Step 2: Test STUN/TURN servers
      this.callbacks.onProgress('Testing STUN/TURN servers...');
      await this.testSTUNTURN();
      this.callbacks.onProgress('STUN/TURN servers accessible ✓');

      this.callbacks.onSuccess('webrtc');
      return true;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.callbacks.onError('webrtc', errorMsg);
      return false;
    }
  }

  // Helper methods
  private async loadDailyLibrary(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).DailyIframe) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.async = true;
      
      script.onload = () => {
        if ((window as any).DailyIframe) {
          resolve();
        } else {
          reject(new Error('Daily library loaded but DailyIframe not available'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Daily.co library from CDN'));
      };

      document.head.appendChild(script);
    });
  }

  private async testDailyAPI(apiKey: string): Promise<string> {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        name: `test-${Date.now()}`,
        privacy: 'private',
        properties: {
          max_participants: 2,
          exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Daily API error (${response.status}): ${errorText}`);
    }

    const room = await response.json();
    return room.url;
  }

  private async testDailyIframe(roomUrl: string): Promise<void> {
    const container = document.getElementById(this.config.containerId);
    if (!container) {
      throw new Error(`Container ${this.config.containerId} not found`);
    }

    // Clean up any existing Daily instances first
    this.cleanupDailyInstances();

    // Clear container
    container.innerHTML = '';

    let callFrame: any = null;
    
    try {
      callFrame = (window as any).DailyIframe.createFrame(container, {
        url: roomUrl,
        showLeaveButton: true,
        userName: this.config.displayName
      });

      // Test that iframe was created
      if (!callFrame) {
        throw new Error('Failed to create Daily iframe');
      }

      // Wait a moment to ensure it's properly initialized
      await new Promise(resolve => setTimeout(resolve, 1000));

    } finally {
      // Always clean up
      if (callFrame) {
        try {
          callFrame.destroy();
        } catch (error) {
          console.warn('Error destroying Daily iframe:', error);
        }
      }
      
      // Additional cleanup
      this.cleanupDailyInstances();
      container.innerHTML = '';
    }
  }

  private cleanupDailyInstances(): void {
    try {
      // Check if Daily is available
      if (typeof (window as any).DailyIframe === 'undefined') {
        return;
      }

      // Try to get all existing call frames and destroy them
      const Daily = (window as any).DailyIframe;
      
      // Some versions of Daily have a way to get existing instances
      if (Daily.getCallFrames) {
        const frames = Daily.getCallFrames();
        frames.forEach((frame: any) => {
          try {
            frame.destroy();
          } catch (error) {
            console.warn('Error destroying existing Daily frame:', error);
          }
        });
      }

      // Also try to clean up any iframes in the container
      const container = document.getElementById(this.config.containerId);
      if (container) {
        const iframes = container.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          try {
            iframe.remove();
          } catch (error) {
            console.warn('Error removing iframe:', error);
          }
        });
      }

    } catch (error) {
      console.warn('Error during Daily cleanup:', error);
    }
  }

  private async loadJitsiLibrary(domain: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      
      script.onload = () => {
        if ((window as any).JitsiMeetExternalAPI) {
          resolve();
        } else {
          reject(new Error('Jitsi library loaded but JitsiMeetExternalAPI not available'));
        }
      };
      
      script.onerror = () => {
        reject(new Error(`Failed to load Jitsi library from ${domain}`));
      };

      document.head.appendChild(script);
    });
  }

  private async testJitsiAPI(domain: string): Promise<void> {
    const container = document.getElementById(this.config.containerId);
    if (!container) {
      throw new Error(`Container ${this.config.containerId} not found`);
    }

    const api = new (window as any).JitsiMeetExternalAPI(domain, {
      roomName: `test-${Date.now()}`,
      width: '100%',
      height: '100%',
      parentNode: container,
      userInfo: {
        displayName: this.config.displayName
      }
    });

    // Test that API was created
    if (!api) {
      throw new Error('Failed to create Jitsi API');
    }

    // Clean up
    api.dispose();
  }

  private async testSTUNTURN(): Promise<void> {
    const servers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: `stun:${process.env.NEXT_PUBLIC_COTURN_SERVER}` }
    ];

    const pc = new RTCPeerConnection({ iceServers: servers });
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pc.close();
        reject(new Error('STUN/TURN server test timeout'));
      }, 5000);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          clearTimeout(timeout);
          pc.close();
          resolve();
        }
      };

      // Create a dummy data channel to trigger ICE gathering
      pc.createDataChannel('test');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
    });
  }

  cleanup(): void {
    // Clean up any test artifacts
    const container = document.getElementById(this.config.containerId);
    if (container) {
      container.innerHTML = '';
    }

    // Clean up Daily instances specifically
    this.cleanupDailyInstances();

    // Clean up Jitsi instances
    try {
      if ((window as any).JitsiMeetExternalAPI) {
        // Jitsi instances are usually cleaned up automatically, but clear container
        if (container) {
          const jitsiIframes = container.querySelectorAll('iframe[src*="jitsi"], iframe[src*="meet.jit.si"]');
          jitsiIframes.forEach(iframe => iframe.remove());
        }
      }
    } catch (error) {
      console.warn('Error cleaning up Jitsi instances:', error);
    }
  }
}

// Quick test function for console
export async function quickTestProvider(provider: SimpleVideoProvider): Promise<void> {
  // Clean up any existing instances first
  const existingContainer = document.getElementById('video-test-container');
  if (existingContainer) {
    existingContainer.innerHTML = '';
  }

  const tester = new SimpleVideoTester(
    {
      sessionId: 'test-session',
      displayName: 'Test User',
      containerId: 'video-test-container'
    },
    {
      onSuccess: (p) => console.log(`✅ ${p} test PASSED`),
      onError: (p, error) => console.error(`❌ ${p} test FAILED:`, error),
      onProgress: (msg) => console.log(`🔄 ${msg}`)
    }
  );

  // Create test container if it doesn't exist
  if (!document.getElementById('video-test-container')) {
    const container = document.createElement('div');
    container.id = 'video-test-container';
    container.style.position = 'fixed';
    container.style.top = '-1000px';
    container.style.width = '320px';
    container.style.height = '240px';
    document.body.appendChild(container);
  }

  try {
    // Clean up before starting test
    tester.cleanup();
    
    // Wait a moment for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    switch (provider) {
      case 'daily':
        await tester.testDaily();
        break;
      case 'jitsi-public':
        await tester.testJitsiPublic();
        break;
      case 'jitsi-self':
        await tester.testJitsiSelf();
        break;
      case 'webrtc':
        await tester.testWebRTC();
        break;
    }
  } finally {
    // Always clean up after test
    setTimeout(() => {
      tester.cleanup();
    }, 1000); // Delay cleanup to ensure test completes
  }
}

// Cleanup function for Daily.co specifically
export function cleanupDailyInstances(): void {
  try {
    console.log('🧹 Cleaning up Daily.co instances...');
    
    if (typeof (window as any).DailyIframe === 'undefined') {
      console.log('Daily.co not loaded, nothing to clean up');
      return;
    }

    const Daily = (window as any).DailyIframe;
    
    // Try different cleanup methods
    if (Daily.getCallFrames) {
      const frames = Daily.getCallFrames();
      console.log(`Found ${frames.length} Daily frames to clean up`);
      frames.forEach((frame: any, index: number) => {
        try {
          frame.destroy();
          console.log(`✅ Destroyed Daily frame ${index + 1}`);
        } catch (error) {
          console.warn(`❌ Error destroying Daily frame ${index + 1}:`, error);
        }
      });
    }

    // Clean up any Daily iframes in the DOM
    const dailyIframes = document.querySelectorAll('iframe[src*="daily.co"]');
    console.log(`Found ${dailyIframes.length} Daily iframes in DOM`);
    dailyIframes.forEach((iframe, index) => {
      try {
        iframe.remove();
        console.log(`✅ Removed Daily iframe ${index + 1}`);
      } catch (error) {
        console.warn(`❌ Error removing Daily iframe ${index + 1}:`, error);
      }
    });

    // Clear test containers
    const testContainer = document.getElementById('video-test-container');
    if (testContainer) {
      testContainer.innerHTML = '';
      console.log('✅ Cleared test container');
    }

    console.log('🧹 Daily.co cleanup completed');
    
  } catch (error) {
    console.error('❌ Error during Daily.co cleanup:', error);
  }
}

// Make available in console (only log once)
if (typeof window !== 'undefined') {
  (window as any).testDaily = () => quickTestProvider('daily');
  (window as any).testJitsiPublic = () => quickTestProvider('jitsi-public');
  (window as any).testJitsiSelf = () => quickTestProvider('jitsi-self');
  (window as any).testWebRTC = () => quickTestProvider('webrtc');
  (window as any).cleanupDaily = cleanupDailyInstances;
  
  // Only log if not already logged
  if (!(window as any).__videoTestingLoaded) {
    console.log('🧪 Video testing: testDaily(), testJitsiPublic(), testJitsiSelf(), testWebRTC()');
    console.log('🧹 Cleanup: cleanupDaily() - Clean up Daily.co instances');
    (window as any).__videoTestingLoaded = true;
  }
}