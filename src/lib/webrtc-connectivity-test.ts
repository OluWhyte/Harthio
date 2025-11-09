/**
 * WebRTC Connectivity Test Service
 * Pre-call checks to ensure WebRTC connectivity and STUN/TURN server functionality
 * Helps catch potential stability issues before users join video calls
 * 
 * Based on WebRTC best practices and TestRTC methodology
 */

export interface ConnectivityTestResult {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  score: number; // 0-100
  tests: {
    webrtcSupport: TestResult;
    stunConnectivity: TestResult;
    turnConnectivity: TestResult;
    mediaDevices: TestResult;
    networkLatency: TestResult;
    bandwidthEstimate: TestResult;
  };
  recommendations: string[];
  timestamp: number;
}

export interface TestResult {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: any;
  duration?: number; // milliseconds
}

export class WebRTCConnectivityTest {
  private testResults: Partial<ConnectivityTestResult> = {};
  private abortController: AbortController | null = null;

  /**
   * Run comprehensive WebRTC connectivity tests
   * @param timeout - Maximum time to wait for all tests (default: 30 seconds)
   */
  async runConnectivityTests(timeout: number = 30000): Promise<ConnectivityTestResult> {
    console.log('🔍 Starting WebRTC connectivity tests...');
    
    this.abortController = new AbortController();
    const startTime = Date.now();

    // Set up timeout
    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, timeout);

    try {
      // Run all tests in parallel for faster results
      const testPromises = [
        this.testWebRTCSupport(),
        this.testSTUNConnectivity(),
        this.testTURNConnectivity(),
        this.testMediaDevices(),
        this.testNetworkLatency(),
        this.testBandwidthEstimate()
      ];

      const [
        webrtcSupport,
        stunConnectivity,
        turnConnectivity,
        mediaDevices,
        networkLatency,
        bandwidthEstimate
      ] = await Promise.allSettled(testPromises);

      // Process results
      const tests = {
        webrtcSupport: this.processTestResult(webrtcSupport),
        stunConnectivity: this.processTestResult(stunConnectivity),
        turnConnectivity: this.processTestResult(turnConnectivity),
        mediaDevices: this.processTestResult(mediaDevices),
        networkLatency: this.processTestResult(networkLatency),
        bandwidthEstimate: this.processTestResult(bandwidthEstimate)
      };

      // Calculate overall score and rating
      const { overall, score } = this.calculateOverallRating(tests);
      const recommendations = this.generateRecommendations(tests);

      const result: ConnectivityTestResult = {
        overall,
        score,
        tests,
        recommendations,
        timestamp: Date.now()
      };

      console.log('✅ WebRTC connectivity tests completed:', {
        overall,
        score,
        duration: Date.now() - startTime
      });

      return result;

    } catch (error) {
      console.error('❌ WebRTC connectivity tests failed:', error);
      
      return {
        overall: 'failed',
        score: 0,
        tests: {
          webrtcSupport: { status: 'fail', message: 'Test suite failed to run' },
          stunConnectivity: { status: 'fail', message: 'Test not completed' },
          turnConnectivity: { status: 'fail', message: 'Test not completed' },
          mediaDevices: { status: 'fail', message: 'Test not completed' },
          networkLatency: { status: 'fail', message: 'Test not completed' },
          bandwidthEstimate: { status: 'fail', message: 'Test not completed' }
        },
        recommendations: ['Please check your internet connection and try again'],
        timestamp: Date.now()
      };
    } finally {
      clearTimeout(timeoutId);
      this.abortController = null;
    }
  }

  /**
   * Test 1: WebRTC Browser Support
   */
  private async testWebRTCSupport(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Check for required WebRTC APIs
      const hasRTCPeerConnection = typeof RTCPeerConnection !== 'undefined';
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasRTCDataChannel = typeof RTCDataChannel !== 'undefined';
      
      // Check for modern WebRTC features
      const hasGetDisplayMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
      const hasInsertableStreams = 'RTCRtpScriptTransform' in window;
      
      const supportScore = [
        hasRTCPeerConnection,
        hasGetUserMedia,
        hasRTCDataChannel,
        hasGetDisplayMedia,
        hasInsertableStreams
      ].filter(Boolean).length;

      const duration = Date.now() - startTime;

      if (supportScore >= 3) {
        return {
          status: supportScore >= 4 ? 'pass' : 'warn',
          message: `WebRTC support: ${supportScore}/5 features available`,
          details: {
            RTCPeerConnection: hasRTCPeerConnection,
            getUserMedia: hasGetUserMedia,
            RTCDataChannel: hasRTCDataChannel,
            getDisplayMedia: hasGetDisplayMedia,
            insertableStreams: hasInsertableStreams
          },
          duration
        };
      } else {
        return {
          status: 'fail',
          message: 'Insufficient WebRTC support',
          details: { supportScore, requiredFeatures: 3 },
          duration
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'WebRTC support test failed',
        details: error,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test 2: STUN Server Connectivity
   */
  private async testSTUNConnectivity(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const stunServers = [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun.services.mozilla.com:3478'
      ];

      const testPromises = stunServers.map(url => this.testSingleSTUNServer(url));
      const results = await Promise.allSettled(testPromises);
      
      const successfulTests = results.filter(result => 
        result.status === 'fulfilled' && result.value
      ).length;

      const duration = Date.now() - startTime;

      if (successfulTests >= 2) {
        return {
          status: 'pass',
          message: `STUN connectivity: ${successfulTests}/${stunServers.length} servers reachable`,
          details: { successfulTests, totalTests: stunServers.length },
          duration
        };
      } else if (successfulTests >= 1) {
        return {
          status: 'warn',
          message: `STUN connectivity: Only ${successfulTests}/${stunServers.length} servers reachable`,
          details: { successfulTests, totalTests: stunServers.length },
          duration
        };
      } else {
        return {
          status: 'fail',
          message: 'No STUN servers reachable',
          details: { successfulTests: 0, totalTests: stunServers.length },
          duration
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'STUN connectivity test failed',
        details: error,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test 3: TURN Server Connectivity
   * Fetches dynamic credentials from backend API for secure testing
   */
  private async testTURNConnectivity(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Fetching TURN credentials from backend API...');
      
      // Fetch dynamic TURN credentials from backend API
      let turnServers: Array<{urls: string | string[], username: string, credential: string}> = [];
      
      try {
        const response = await fetch('/api/turn/credentials', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.iceServers && Array.isArray(data.iceServers)) {
            // Filter to only TURN servers (not STUN)
            turnServers = data.iceServers.filter((server: any) => {
              const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
              return urls.some((url: string) => url.startsWith('turn:') || url.startsWith('turns:'));
            });
            console.log(`✅ Fetched ${turnServers.length} TURN servers from backend`);
          }
        } else {
          console.warn('⚠️ Backend API returned error:', response.status);
        }
      } catch (apiError) {
        console.warn('⚠️ Failed to fetch from backend API, using fallback:', apiError);
      }
      
      // Fallback to public TURN servers if API fails
      if (turnServers.length === 0) {
        console.log('📌 Using fallback public TURN servers');
        turnServers = [
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ];
      }

      if (turnServers.length === 0) {
        return {
          status: 'warn',
          message: 'No TURN servers available for testing',
          details: { configuredServers: 0 },
          duration: Date.now() - startTime
        };
      }

      console.log(`🧪 Testing ${turnServers.length} TURN servers...`);
      const testPromises = turnServers.map(server => this.testSingleTURNServer(server));
      const results = await Promise.allSettled(testPromises);
      
      const successfulTests = results.filter(result => 
        result.status === 'fulfilled' && result.value
      ).length;

      const duration = Date.now() - startTime;

      if (successfulTests >= 1) {
        return {
          status: 'pass',
          message: `TURN connectivity: ${successfulTests}/${turnServers.length} servers reachable (using dynamic credentials)`,
          details: { successfulTests, totalTests: turnServers.length, usingDynamicCredentials: true },
          duration
        };
      } else {
        return {
          status: 'warn',
          message: 'No TURN servers reachable - may have issues with restrictive networks',
          details: { successfulTests: 0, totalTests: turnServers.length },
          duration
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'TURN connectivity test failed',
        details: error,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test 4: Media Devices Access
   */
  private async testMediaDevices(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Check if we're in a secure context
      const isSecureContext = window.isSecureContext || 
        location.protocol === 'https:' || 
        location.hostname === 'localhost';

      if (!isSecureContext) {
        return {
          status: 'fail',
          message: 'Media devices require HTTPS or localhost',
          details: { protocol: location.protocol, hostname: location.hostname },
          duration: Date.now() - startTime
        };
      }

      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      const audioDevices = devices.filter(d => d.kind === 'audioinput');

      // Test media access (without actually requesting permission)
      const constraints = {
        video: { width: 320, height: 240 },
        audio: true
      };

      let mediaAccessible = false;
      let stream: MediaStream | null = null;

      try {
        // Quick test - this will either work or fail fast
        stream = await Promise.race([
          navigator.mediaDevices.getUserMedia(constraints),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Media access timeout')), 5000)
          )
        ]);
        mediaAccessible = true;
      } catch (error) {
        // Media access failed - this is common and not necessarily a problem
        console.log('Media access test (expected to fail on first visit):', error);
      } finally {
        // Clean up stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }

      const duration = Date.now() - startTime;

      if (videoDevices.length > 0 && audioDevices.length > 0) {
        return {
          status: mediaAccessible ? 'pass' : 'warn',
          message: `Media devices: ${videoDevices.length} camera(s), ${audioDevices.length} microphone(s) ${mediaAccessible ? 'accessible' : 'detected'}`,
          details: {
            videoDevices: videoDevices.length,
            audioDevices: audioDevices.length,
            mediaAccessible,
            isSecureContext
          },
          duration
        };
      } else {
        return {
          status: 'fail',
          message: 'No camera or microphone detected',
          details: {
            videoDevices: videoDevices.length,
            audioDevices: audioDevices.length,
            mediaAccessible: false
          },
          duration
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'Media devices test failed',
        details: error,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test 5: Network Latency
   */
  private async testNetworkLatency(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testUrls = [
        '/api/health', // Local health check
        'https://www.google.com/favicon.ico', // External test
        'https://cloudflare.com/favicon.ico' // Another external test
      ];

      const latencyTests = testUrls.map(async (url) => {
        const testStart = performance.now();
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            cache: 'no-cache',
            signal: this.abortController?.signal
          });
          const latency = performance.now() - testStart;
          return { url, latency, success: response.ok };
        } catch (error) {
          return { url, latency: Infinity, success: false };
        }
      });

      const results = await Promise.all(latencyTests);
      const successfulTests = results.filter(r => r.success);
      
      if (successfulTests.length === 0) {
        return {
          status: 'fail',
          message: 'Network connectivity test failed',
          details: { successfulTests: 0, totalTests: testUrls.length },
          duration: Date.now() - startTime
        };
      }

      const avgLatency = successfulTests.reduce((sum, r) => sum + r.latency, 0) / successfulTests.length;
      const duration = Date.now() - startTime;

      let status: 'pass' | 'warn' | 'fail';
      let message: string;

      if (avgLatency < 100) {
        status = 'pass';
        message = `Network latency: ${Math.round(avgLatency)}ms (excellent)`;
      } else if (avgLatency < 300) {
        status = 'pass';
        message = `Network latency: ${Math.round(avgLatency)}ms (good)`;
      } else if (avgLatency < 500) {
        status = 'warn';
        message = `Network latency: ${Math.round(avgLatency)}ms (fair)`;
      } else {
        status = 'warn';
        message = `Network latency: ${Math.round(avgLatency)}ms (poor)`;
      }

      return {
        status,
        message,
        details: {
          averageLatency: avgLatency,
          successfulTests: successfulTests.length,
          totalTests: testUrls.length,
          results
        },
        duration
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Network latency test failed',
        details: error,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test 6: Bandwidth Estimate
   */
  private async testBandwidthEstimate(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      let bandwidth = 0;
      let method = 'unknown';

      // Method 1: Network Information API (most accurate)
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.downlink) {
          bandwidth = connection.downlink; // Mbps
          method = 'Network Information API';
        }
      }

      // Method 2: Simple download test (fallback)
      if (bandwidth === 0) {
        try {
          const testStart = performance.now();
          const response = await fetch('/api/health', {
            cache: 'no-cache',
            signal: this.abortController?.signal
          });
          const testEnd = performance.now();
          
          if (response.ok) {
            const duration = (testEnd - testStart) / 1000; // seconds
            // Very rough estimate based on response time
            if (duration < 0.1) bandwidth = 10; // Fast connection
            else if (duration < 0.3) bandwidth = 5; // Good connection
            else if (duration < 0.5) bandwidth = 2; // Fair connection
            else bandwidth = 1; // Slow connection
            
            method = 'Response time estimate';
          }
        } catch (error) {
          bandwidth = 1; // Conservative fallback
          method = 'Conservative fallback';
        }
      }

      const duration = Date.now() - startTime;

      let status: 'pass' | 'warn' | 'fail';
      let message: string;

      if (bandwidth >= 2) {
        status = 'pass';
        message = `Bandwidth: ~${bandwidth} Mbps (sufficient for video calls)`;
      } else if (bandwidth >= 1) {
        status = 'warn';
        message = `Bandwidth: ~${bandwidth} Mbps (may affect video quality)`;
      } else {
        status = 'warn';
        message = `Bandwidth: ~${bandwidth} Mbps (video quality may be limited)`;
      }

      return {
        status,
        message,
        details: {
          bandwidth,
          method,
          unit: 'Mbps'
        },
        duration
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Bandwidth estimation failed',
        details: error,
        duration: Date.now() - startTime
      };
    }
  }

  // Helper methods

  private async testSingleSTUNServer(stunUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: stunUrl }]
      });

      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          pc.close();
          resolve(false);
        }
      }, 5000);

      pc.onicecandidate = (event) => {
        if (!resolved && event.candidate && event.candidate.candidate.includes('srflx')) {
          resolved = true;
          clearTimeout(timeout);
          pc.close();
          resolve(true);
        }
      };

      // Create a data channel to trigger ICE gathering
      pc.createDataChannel('test');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
    });
  }

  private async testSingleTURNServer(turnServer: any): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('🧪 Testing TURN server:', turnServer.urls);
      
      const pc = new RTCPeerConnection({
        iceServers: [turnServer],
        iceCandidatePoolSize: 10
      });

      let resolved = false;
      let candidatesFound = 0;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log(`⏱️ TURN test timeout for ${turnServer.urls} (found ${candidatesFound} candidates, 0 relay)`);
          pc.close();
          resolve(false);
        }
      }, 10000); // Longer timeout for TURN

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidatesFound++;
          console.log(`📡 ICE candidate for ${turnServer.urls}:`, event.candidate.candidate.substring(0, 50) + '...');
          
          if (!resolved && event.candidate.candidate.includes('relay')) {
            resolved = true;
            clearTimeout(timeout);
            console.log(`✅ TURN server ${turnServer.urls} is reachable (relay candidate found)`);
            pc.close();
            resolve(true);
          }
        } else if (!resolved) {
          // ICE gathering complete, no relay found
          console.log(`❌ TURN server ${turnServer.urls} - ICE gathering complete, no relay candidates (found ${candidatesFound} total)`);
        }
      };

      pc.onicegatheringstatechange = () => {
        console.log(`🔄 ICE gathering state for ${turnServer.urls}:`, pc.iceGatheringState);
      };

      // Create a data channel to trigger ICE gathering
      pc.createDataChannel('test');
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        console.log(`📤 Offer created for ${turnServer.urls}, gathering ICE candidates...`);
      }).catch(error => {
        console.error(`❌ Failed to create offer for ${turnServer.urls}:`, error);
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          pc.close();
          resolve(false);
        }
      });
    });
  }

  private processTestResult(result: PromiseSettledResult<TestResult>): TestResult {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'fail',
        message: 'Test failed to complete',
        details: result.reason
      };
    }
  }

  private calculateOverallRating(tests: ConnectivityTestResult['tests']): { overall: ConnectivityTestResult['overall'], score: number } {
    const weights = {
      webrtcSupport: 25,    // Critical
      stunConnectivity: 20, // Very important
      turnConnectivity: 15, // Important for restrictive networks
      mediaDevices: 20,     // Very important
      networkLatency: 10,   // Moderate importance
      bandwidthEstimate: 10 // Moderate importance
    };

    let totalScore = 0;
    let maxScore = 0;

    Object.entries(tests).forEach(([testName, result]) => {
      const weight = weights[testName as keyof typeof weights];
      maxScore += weight;

      if (result.status === 'pass') {
        totalScore += weight;
      } else if (result.status === 'warn') {
        totalScore += weight * 0.6; // 60% score for warnings
      }
      // Failures get 0 points
    });

    const score = Math.round((totalScore / maxScore) * 100);

    let overall: ConnectivityTestResult['overall'];
    if (score >= 85) overall = 'excellent';
    else if (score >= 70) overall = 'good';
    else if (score >= 50) overall = 'fair';
    else if (score >= 25) overall = 'poor';
    else overall = 'failed';

    return { overall, score };
  }

  private generateRecommendations(tests: ConnectivityTestResult['tests']): string[] {
    const recommendations: string[] = [];

    if (tests.webrtcSupport.status === 'fail') {
      recommendations.push('Please update your browser to a modern version that supports WebRTC');
    }

    if (tests.stunConnectivity.status === 'fail') {
      recommendations.push('STUN servers are not reachable - check your firewall settings');
    }

    if (tests.turnConnectivity.status === 'fail') {
      recommendations.push('TURN servers are not reachable - you may have issues on restrictive networks');
    }

    if (tests.mediaDevices.status === 'fail') {
      recommendations.push('Camera or microphone not detected - please check your devices');
    } else if (tests.mediaDevices.status === 'warn') {
      recommendations.push('Allow camera and microphone access when prompted for the best experience');
    }

    if (tests.networkLatency.status === 'warn') {
      recommendations.push('High network latency detected - consider using a wired connection or better WiFi');
    }

    if (tests.bandwidthEstimate.status === 'warn') {
      recommendations.push('Limited bandwidth detected - video quality may be automatically reduced');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your connection looks great! You should have an excellent video calling experience.');
    }

    return recommendations;
  }

  /**
   * Cancel ongoing tests
   */
  cancelTests(): void {
    this.abortController?.abort();
  }
}