/**
 * Video Provider Test Utility
 * Quick test to verify which video providers are working
 */

import { VideoServiceManager, type VideoServiceConfig, type VideoServiceCallbacks, type VideoProvider } from './video-service-manager';

export interface ProviderTestResult {
  provider: VideoProvider;
  success: boolean;
  error?: string;
  connectionTime?: number;
  quality?: string;
}

export class VideoProviderTester {
  private testResults: ProviderTestResult[] = [];
  private testContainer: HTMLElement | null = null;

  async testAllProviders(sessionId: string = 'test-session'): Promise<ProviderTestResult[]> {
    console.log('🧪 Starting video provider tests...');
    
    // Create a hidden test container
    this.createTestContainer();
    
    const config: VideoServiceConfig = {
      sessionId,
      displayName: 'Test User',
      email: 'test@harthio.com'
    };

    const providers: VideoProvider[] = ['webrtc', 'daily', 'jitsi-public', 'jitsi-self'];
    this.testResults = [];

    for (const provider of providers) {
      console.log(`🧪 Testing ${provider}...`);
      const result = await this.testProvider(provider, config);
      this.testResults.push(result);
      console.log(`🧪 ${provider} test result:`, result);
      
      // Wait between tests
      await this.delay(2000);
    }

    this.cleanupTestContainer();
    return this.testResults;
  }

  private async testProvider(provider: VideoProvider, config: VideoServiceConfig): Promise<ProviderTestResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          provider,
          success: false,
          error: 'Test timeout (30s)',
          connectionTime: Date.now() - startTime
        });
      }, 30000); // 30 second timeout

      const callbacks: VideoServiceCallbacks = {
        onReady: () => {
          clearTimeout(timeout);
          resolve({
            provider,
            success: true,
            connectionTime: Date.now() - startTime,
            quality: 'ready'
          });
        },
        onJoined: () => {
          clearTimeout(timeout);
          resolve({
            provider,
            success: true,
            connectionTime: Date.now() - startTime,
            quality: 'joined'
          });
        },
        onLeft: () => {
          // This is expected during cleanup
        },
        onError: (error) => {
          clearTimeout(timeout);
          resolve({
            provider,
            success: false,
            error: error.message || 'Unknown error',
            connectionTime: Date.now() - startTime
          });
        },
        onMessage: () => {},
        onParticipantJoined: () => {},
        onParticipantLeft: () => {},
        onConnectionQualityChanged: () => {},
        onProviderChanged: (newProvider, reason) => {
          if (newProvider === 'webrtc') {
            // WebRTC fallback is handled differently
            clearTimeout(timeout);
            resolve({
              provider,
              success: true,
              connectionTime: Date.now() - startTime,
              quality: 'webrtc-fallback'
            });
          }
        }
      };

      try {
        const manager = new VideoServiceManager(config, callbacks);
        
        // Force test specific provider
        manager.switchToProvider(provider).catch((error) => {
          clearTimeout(timeout);
          resolve({
            provider,
            success: false,
            error: error.message || 'Failed to switch to provider',
            connectionTime: Date.now() - startTime
          });
        });
        
        // Initialize with test container
        manager.initialize('video-test-container').catch((error) => {
          clearTimeout(timeout);
          resolve({
            provider,
            success: false,
            error: error.message || 'Failed to initialize',
            connectionTime: Date.now() - startTime
          });
        });

        // Cleanup after test
        setTimeout(() => {
          try {
            manager.dispose();
          } catch (e) {
            console.warn('Error disposing manager:', e);
          }
        }, 5000);

      } catch (error) {
        clearTimeout(timeout);
        resolve({
          provider,
          success: false,
          error: (error as Error).message || 'Failed to create manager',
          connectionTime: Date.now() - startTime
        });
      }
    });
  }

  private createTestContainer(): void {
    this.testContainer = document.createElement('div');
    this.testContainer.id = 'video-test-container';
    this.testContainer.style.position = 'fixed';
    this.testContainer.style.top = '-1000px';
    this.testContainer.style.left = '-1000px';
    this.testContainer.style.width = '320px';
    this.testContainer.style.height = '240px';
    this.testContainer.style.visibility = 'hidden';
    document.body.appendChild(this.testContainer);
  }

  private cleanupTestContainer(): void {
    if (this.testContainer) {
      document.body.removeChild(this.testContainer);
      this.testContainer = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getTestResults(): ProviderTestResult[] {
    return [...this.testResults];
  }

  getWorkingProviders(): VideoProvider[] {
    return this.testResults
      .filter(result => result.success)
      .map(result => result.provider);
  }

  getBestProvider(): VideoProvider | null {
    const workingProviders = this.testResults.filter(result => result.success);
    
    if (workingProviders.length === 0) {
      return null;
    }

    // Sort by connection time (faster is better)
    workingProviders.sort((a, b) => (a.connectionTime || 0) - (b.connectionTime || 0));
    
    return workingProviders[0].provider;
  }

  generateReport(): string {
    let report = '📊 Video Provider Test Report\n';
    report += '================================\n\n';

    this.testResults.forEach(result => {
      report += `${result.provider.toUpperCase()}:\n`;
      report += `  Status: ${result.success ? '✅ Working' : '❌ Failed'}\n`;
      if (result.connectionTime) {
        report += `  Connection Time: ${result.connectionTime}ms\n`;
      }
      if (result.error) {
        report += `  Error: ${result.error}\n`;
      }
      if (result.quality) {
        report += `  Quality: ${result.quality}\n`;
      }
      report += '\n';
    });

    const workingCount = this.testResults.filter(r => r.success).length;
    report += `Summary: ${workingCount}/${this.testResults.length} providers working\n`;
    
    const bestProvider = this.getBestProvider();
    if (bestProvider) {
      report += `Recommended: ${bestProvider.toUpperCase()}\n`;
    }

    return report;
  }
}

// Utility function for quick testing
export async function quickTestProviders(): Promise<void> {
  const tester = new VideoProviderTester();
  const results = await tester.testAllProviders();
  console.log(tester.generateReport());
  return;
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).testVideoProviders = quickTestProviders;
  (window as any).VideoProviderTester = VideoProviderTester;
  
  // Add a simple console command
  (window as any).testVideo = async () => {
    console.log('🧪 Starting video provider tests...');
    console.log('This will test: WebRTC, Daily.co, Jitsi Public, and Jitsi Self-hosted');
    console.log('Please wait, this may take up to 2 minutes...');
    
    try {
      await quickTestProviders();
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  };
  
  console.log('💡 Video testing available! Run testVideo() in console to test all providers.');
}