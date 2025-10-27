/**
 * Video Provider Testing Utilities
 * Functions to test video calling providers programmatically
 */

export interface ProviderTestResult {
  provider: string;
  available: boolean;
  latency?: number;
  error?: string;
  details?: any;
}

export class VideoProviderTester {
  
  /**
   * Test Jitsi Meet Public availability
   */
  static async testJitsiPublic(): Promise<ProviderTestResult> {
    try {
      const startTime = performance.now();
      const response = await fetch('https://meet.jit.si/external_api.js', { 
        method: 'HEAD',
        mode: 'no-cors' // Avoid CORS issues for testing
      });
      const endTime = performance.now();
      
      return {
        provider: 'jitsi-public',
        available: true, // no-cors mode always returns opaque response
        latency: endTime - startTime,
        details: { status: 'reachable' }
      };
    } catch (error) {
      return {
        provider: 'jitsi-public',
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Daily.co API availability
   */
  static async testDailyCo(): Promise<ProviderTestResult> {
    try {
      const startTime = performance.now();
      const response = await fetch('https://unpkg.com/@daily-co/daily-js', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      const endTime = performance.now();
      
      return {
        provider: 'daily',
        available: true,
        latency: endTime - startTime,
        details: { status: 'reachable' }
      };
    } catch (error) {
      return {
        provider: 'daily',
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test WebRTC capabilities
   */
  static async testWebRTC(): Promise<ProviderTestResult> {
    try {
      // Test basic WebRTC support
      if (!window.RTCPeerConnection) {
        return {
          provider: 'webrtc',
          available: false,
          error: 'RTCPeerConnection not supported'
        };
      }

      // Test media access
      const startTime = performance.now();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      const endTime = performance.now();
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      
      return {
        provider: 'webrtc',
        available: true,
        latency: endTime - startTime,
        details: { 
          mediaAccess: true,
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length
        }
      };
    } catch (error) {
      return {
        provider: 'webrtc',
        available: false,
        error: error instanceof Error ? error.message : 'Media access denied'
      };
    }
  }

  /**
   * Test network quality for video calling
   */
  static async testNetworkQuality(): Promise<ProviderTestResult> {
    try {
      const tests = [
        { url: 'https://meet.jit.si/favicon.ico', name: 'Jitsi' },
        { url: 'https://www.daily.co/favicon.ico', name: 'Daily.co' },
        { url: 'https://www.google.com/favicon.ico', name: 'Google' }
      ];

      const results = await Promise.allSettled(
        tests.map(async (test) => {
          const startTime = performance.now();
          const response = await fetch(test.url, { method: 'HEAD' });
          const endTime = performance.now();
          return {
            name: test.name,
            latency: endTime - startTime,
            success: response.ok
          };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const avgLatency = results
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + (r.value as any).latency, 0) / successful;

      return {
        provider: 'network',
        available: successful > 0,
        latency: avgLatency,
        details: {
          testsSuccessful: successful,
          totalTests: tests.length,
          results: results.map(r => r.status === 'fulfilled' ? r.value : { error: true })
        }
      };
    } catch (error) {
      return {
        provider: 'network',
        available: false,
        error: error instanceof Error ? error.message : 'Network test failed'
      };
    }
  }

  /**
   * Test mobile-specific video constraints
   */
  static async testMobileVideo(): Promise<ProviderTestResult> {
    try {
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 360, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const startTime = performance.now();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const endTime = performance.now();

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      const videoSettings = videoTrack?.getSettings();
      const audioSettings = audioTrack?.getSettings();

      // Clean up
      stream.getTracks().forEach(track => track.stop());

      return {
        provider: 'mobile-video',
        available: true,
        latency: endTime - startTime,
        details: {
          video: videoSettings,
          audio: audioSettings,
          mobileOptimized: videoSettings && 
            (videoSettings.width || 0) <= 1280 && 
            (videoSettings.height || 0) <= 720
        }
      };
    } catch (error) {
      return {
        provider: 'mobile-video',
        available: false,
        error: error instanceof Error ? error.message : 'Mobile video test failed'
      };
    }
  }

  /**
   * Run all provider tests
   */
  static async testAllProviders(): Promise<ProviderTestResult[]> {
    const tests = [
      this.testJitsiPublic(),
      this.testDailyCo(),
      this.testWebRTC(),
      this.testNetworkQuality(),
      this.testMobileVideo()
    ];

    const results = await Promise.allSettled(tests);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const providers = ['jitsi-public', 'daily', 'webrtc', 'network', 'mobile-video'];
        return {
          provider: providers[index],
          available: false,
          error: result.reason?.message || 'Test failed'
        };
      }
    });
  }

  /**
   * Get device and browser information
   */
  static getDeviceInfo() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    return {
      userAgent: navigator.userAgent,
      isMobile,
      isIOS,
      isAndroid,
      screen: {
        width: window.screen?.width || window.innerWidth,
        height: window.screen?.height || window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null
    };
  }
}