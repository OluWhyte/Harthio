/**
 * Intelligent Video Service Manager
 * Advanced provider selection with real-time performance monitoring
 * Features:
 * - Dynamic provider performance testing
 * - Background continuous monitoring
 * - Automatic provider switching during calls
 * - Performance-based priority adjustment
 */

import { VideoServiceManager, type VideoServiceConfig, type VideoServiceCallbacks, type VideoProvider } from './video-service-manager';
import { VideoProviderTester, type ProviderTestResult } from './test-video-providers';

export interface ProviderPerformance {
  provider: VideoProvider;
  latency: number;
  availability: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  lastTested: Date;
  successRate: number; // 0-1
  connectionTime: number; // ms to establish connection
}

export interface IntelligentVideoCallbacks extends VideoServiceCallbacks {
  onProviderPerformanceUpdate: (performance: ProviderPerformance[]) => void;
  onBackgroundSwitching: (fromProvider: VideoProvider, toProvider: VideoProvider, reason: string) => void;
}

export class IntelligentVideoManager {
  private videoServiceManager: VideoServiceManager | null = null;
  private config: VideoServiceConfig;
  private callbacks: IntelligentVideoCallbacks;
  private containerId: string = '';
  
  // Performance tracking
  private providerPerformance: Map<VideoProvider, ProviderPerformance> = new Map();
  private performanceHistory: Map<VideoProvider, number[]> = new Map(); // latency history
  private backgroundMonitoringInterval: NodeJS.Timeout | null = null;
  private qualityCheckInterval: NodeJS.Timeout | null = null;
  
  // Configuration
  private readonly PERFORMANCE_TEST_INTERVAL = 30000; // 30 seconds
  private readonly QUALITY_CHECK_INTERVAL = 10000; // 10 seconds
  private readonly SWITCH_THRESHOLD_LATENCY = 500; // ms
  private readonly SWITCH_THRESHOLD_QUALITY = 'poor';
  private readonly HISTORY_SIZE = 10; // Keep last 10 measurements
  
  // State
  private isInitialized = false;
  private isBackgroundTesting = false;
  private currentProvider: VideoProvider | null = null;

  constructor(config: VideoServiceConfig, callbacks: IntelligentVideoCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
    this.initializeProviderPerformance();
  }

  private initializeProviderPerformance(): void {
    const providers: VideoProvider[] = ['jitsi-public', 'daily', 'jitsi-self', 'webrtc'];
    
    providers.forEach(provider => {
      this.providerPerformance.set(provider, {
        provider,
        latency: Infinity,
        availability: false,
        quality: 'failed',
        lastTested: new Date(0),
        successRate: 0,
        connectionTime: Infinity
      });
      this.performanceHistory.set(provider, []);
    });
  }

  async initialize(containerId: string): Promise<void> {
    this.containerId = containerId;
    
    // First, test all providers to determine the best one
    await this.performInitialProviderTesting();
    
    // Get the best provider based on performance
    const bestProvider = this.getBestProvider();
    
    // Initialize with the best provider
    await this.initializeWithProvider(bestProvider);
    
    // Start background monitoring
    this.startBackgroundMonitoring();
    
    this.isInitialized = true;
  }

  async testProvidersOnly(): Promise<void> {
    // Only test providers without initializing video services
    console.log('🔍 Testing providers in background...');
    await this.performInitialProviderTesting();
    
    // Don't initialize video services, just prepare performance data
    const bestProvider = this.getBestProvider();
    console.log(`🏆 Best provider identified: ${bestProvider}`);
    
    // Start background monitoring for continuous testing
    this.startBackgroundMonitoring();
  }

  private async performInitialProviderTesting(): Promise<void> {
    console.log('🔍 Testing all video providers to find the best one...');
    
    const providers = ['daily', 'jitsi-public', 'jitsi-self', 'webrtc'];
    console.log('🔍 Testing providers in order:', providers);
    
    const testPromises = [
      this.testProviderPerformance('daily'),
      this.testProviderPerformance('jitsi-public'),
      this.testProviderPerformance('jitsi-self'),
      this.testProviderPerformance('webrtc')
    ];

    const results = await Promise.allSettled(testPromises);
    
    console.log('📊 Provider testing complete. Results:');
    results.forEach((result, index) => {
      const provider = providers[index];
      if (result.status === 'rejected') {
        console.log(`  ${provider}: ❌ Test failed - ${result.reason}`);
      }
    });
    
    this.providerPerformance.forEach((perf, provider) => {
      console.log(`  ${provider}: ${perf.availability ? '✅' : '❌'} (${perf.connectionTime}ms, ${perf.quality})`);
    });
    
    // Notify about performance update
    this.callbacks.onProviderPerformanceUpdate(Array.from(this.providerPerformance.values()));
  }

  private async testProviderPerformance(provider: VideoProvider): Promise<void> {
    const startTime = window.performance.now();
    console.log(`🧪 Testing provider: ${provider}`);
    
    try {
      let result: ProviderTestResult;
      
      switch (provider) {
        case 'jitsi-public':
          result = await VideoProviderTester.testJitsiPublic();
          break;
        case 'daily':
          result = await VideoProviderTester.testDailyCo();
          break;
        case 'webrtc':
          result = await VideoProviderTester.testWebRTC();
          break;
        case 'jitsi-self':
          // Test self-hosted Jitsi (similar to public but with custom domain)
          result = await this.testJitsiSelf();
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
      
      const connectionTime = window.performance.now() - startTime;
      const latency = result.latency || connectionTime;
      
      // Calculate quality based on latency and availability
      let quality: 'excellent' | 'good' | 'fair' | 'poor' | 'failed' = 'failed';
      if (result.available) {
        if (latency < 100) quality = 'excellent';
        else if (latency < 200) quality = 'good';
        else if (latency < 400) quality = 'fair';
        else quality = 'poor';
      }
      
      // Update performance data
      const providerPerformance: ProviderPerformance = {
        provider,
        latency,
        availability: result.available,
        quality,
        lastTested: new Date(),
        successRate: result.available ? 1 : 0,
        connectionTime
      };
      
      this.providerPerformance.set(provider, providerPerformance);
      
      // Update history
      const history = this.performanceHistory.get(provider) || [];
      history.push(latency);
      if (history.length > this.HISTORY_SIZE) {
        history.shift();
      }
      this.performanceHistory.set(provider, history);
      
      console.log(`📊 ${provider}: ${quality} (${latency.toFixed(0)}ms)`);
      
    } catch (error) {
      console.error(`❌ ${provider} test failed:`, error);
      
      const failedPerformance: ProviderPerformance = {
        provider,
        latency: Infinity,
        availability: false,
        quality: 'failed',
        lastTested: new Date(),
        successRate: 0,
        connectionTime: Infinity
      };
      
      this.providerPerformance.set(provider, failedPerformance);
    }
  }

  private async testJitsiSelf(): Promise<ProviderTestResult> {
    try {
      const customDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'session.harthio.com';
      const startTime = window.performance.now();
      
      const response = await fetch(`https://${customDomain}/external_api.js`, { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      const endTime = performance.now();
      
      return {
        provider: 'jitsi-self',
        available: true,
        latency: endTime - startTime,
        details: { domain: customDomain }
      };
    } catch (error) {
      return {
        provider: 'jitsi-self',
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getBestProvider(): VideoProvider {
    const performances = Array.from(this.providerPerformance.values())
      .filter(p => p.availability)
      .sort((a, b) => {
        // Sort by quality first, then by latency
        const qualityOrder = { excellent: 4, good: 3, fair: 2, poor: 1, failed: 0 };
        const qualityDiff = qualityOrder[b.quality] - qualityOrder[a.quality];
        
        if (qualityDiff !== 0) return qualityDiff;
        return a.latency - b.latency;
      });
    
    if (performances.length === 0) {
      console.warn('⚠️ No providers available, falling back to webrtc');
      return 'webrtc';
    }
    
    const best = performances[0];
    console.log(`🏆 Best provider: ${best.provider} (${best.quality}, ${best.latency.toFixed(0)}ms)`);
    
    return best.provider;
  }

  private async initializeWithProvider(provider: VideoProvider): Promise<void> {
    // Create enhanced callbacks that include our monitoring
    const enhancedCallbacks: VideoServiceCallbacks = {
      ...this.callbacks,
      onError: (error, failedProvider) => {
        // Update performance data for failed provider
        const perf = this.providerPerformance.get(failedProvider);
        if (perf) {
          perf.availability = false;
          perf.quality = 'failed';
          perf.successRate = Math.max(0, perf.successRate - 0.1);
          this.providerPerformance.set(failedProvider, perf);
        }
        
        // Try to switch to next best provider
        this.handleProviderFailure(failedProvider);
        
        // Call original error handler
        this.callbacks.onError(error, failedProvider);
      },
      onProviderChanged: (newProvider, reason) => {
        this.currentProvider = newProvider;
        
        // Update success rate for successful provider
        const perf = this.providerPerformance.get(newProvider);
        if (perf) {
          perf.availability = true;
          perf.successRate = Math.min(1, perf.successRate + 0.1);
          this.providerPerformance.set(newProvider, perf);
        }
        
        // Call original handler
        this.callbacks.onProviderChanged(newProvider, reason);
      }
    };

    this.videoServiceManager = new VideoServiceManager(this.config, enhancedCallbacks);
    await this.videoServiceManager.initialize(this.containerId);
  }

  private async handleProviderFailure(failedProvider: VideoProvider): Promise<void> {
    console.log(`🔄 Provider ${failedProvider} failed, finding alternative...`);
    
    // Only try to switch if we have a container available (user has joined)
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.log(`📝 No container available, skipping provider switch for ${failedProvider}`);
      return;
    }
    
    // Get next best provider (excluding the failed one)
    const alternatives = Array.from(this.providerPerformance.values())
      .filter(p => p.provider !== failedProvider && p.availability)
      .sort((a, b) => {
        const qualityOrder = { excellent: 4, good: 3, fair: 2, poor: 1, failed: 0 };
        const qualityDiff = qualityOrder[b.quality] - qualityOrder[a.quality];
        if (qualityDiff !== 0) return qualityDiff;
        return a.latency - b.latency;
      });

    if (alternatives.length > 0) {
      const nextBest = alternatives[0];
      console.log(`🔄 Switching to ${nextBest.provider}`);
      
      this.callbacks.onBackgroundSwitching(failedProvider, nextBest.provider, 'Provider failure');
      
      // Switch to the new provider
      if (this.videoServiceManager) {
        try {
          await this.videoServiceManager.switchToProvider(nextBest.provider);
        } catch (error) {
          console.error(`Failed to switch to ${nextBest.provider}:`, error);
        }
      }
    }
  }

  private startBackgroundMonitoring(): void {
    // Performance testing interval
    this.backgroundMonitoringInterval = setInterval(async () => {
      if (!this.isBackgroundTesting) {
        this.isBackgroundTesting = true;
        await this.performBackgroundTesting();
        this.isBackgroundTesting = false;
      }
    }, this.PERFORMANCE_TEST_INTERVAL);

    // Quality monitoring interval
    this.qualityCheckInterval = setInterval(() => {
      this.checkCurrentProviderQuality();
    }, this.QUALITY_CHECK_INTERVAL);
  }

  private async performBackgroundTesting(): Promise<void> {
    console.log('🔍 Background testing providers...');
    
    // Test all providers except the current one
    const providersToTest = (['jitsi-public', 'daily', 'jitsi-self', 'webrtc'] as VideoProvider[])
      .filter(p => p !== this.currentProvider);
    
    const testPromises = providersToTest.map(provider => 
      this.testProviderPerformance(provider)
    );
    
    await Promise.allSettled(testPromises);
    
    // Check if we should switch to a better provider
    await this.considerProviderSwitch();
    
    // Notify about performance update
    this.callbacks.onProviderPerformanceUpdate(Array.from(this.providerPerformance.values()));
  }

  private async considerProviderSwitch(): Promise<void> {
    if (!this.currentProvider || !this.videoServiceManager) return;
    
    // Only consider switching if we have a container available (user has joined)
    const container = document.getElementById(this.containerId);
    if (!container) {
      return;
    }
    
    const currentPerf = this.providerPerformance.get(this.currentProvider);
    if (!currentPerf) return;
    
    // Find better alternatives
    const betterProviders = Array.from(this.providerPerformance.values())
      .filter(p => 
        p.provider !== this.currentProvider && 
        p.availability &&
        (p.latency < currentPerf.latency - 100 || // Significantly better latency
         (currentPerf.quality === 'poor' && p.quality !== 'poor')) // Better quality when current is poor
      )
      .sort((a, b) => {
        const qualityOrder = { excellent: 4, good: 3, fair: 2, poor: 1, failed: 0 };
        const qualityDiff = qualityOrder[b.quality] - qualityOrder[a.quality];
        if (qualityDiff !== 0) return qualityDiff;
        return a.latency - b.latency;
      });

    if (betterProviders.length > 0) {
      const betterProvider = betterProviders[0];
      const improvement = currentPerf.latency - betterProvider.latency;
      
      console.log(`🚀 Found better provider: ${betterProvider.provider} (${improvement.toFixed(0)}ms improvement)`);
      
      this.callbacks.onBackgroundSwitching(
        this.currentProvider, 
        betterProvider.provider, 
        `Better performance (${improvement.toFixed(0)}ms improvement)`
      );
      
      // Switch to the better provider
      try {
        await this.videoServiceManager.switchToProvider(betterProvider.provider);
      } catch (error) {
        console.error(`Failed to switch to better provider ${betterProvider.provider}:`, error);
      }
    }
  }

  private async checkCurrentProviderQuality(): Promise<void> {
    if (!this.currentProvider || !this.videoServiceManager) return;
    
    try {
      const stats = await this.videoServiceManager.getConnectionStats();
      if (stats) {
        // Update current provider performance based on real connection stats
        const currentPerf = this.providerPerformance.get(this.currentProvider);
        if (currentPerf) {
          // Update quality based on actual connection stats
          if (stats.quality) {
            currentPerf.quality = stats.quality;
          }
          if (stats.latency) {
            currentPerf.latency = stats.latency;
          }
          
          this.providerPerformance.set(this.currentProvider, currentPerf);
        }
      }
    } catch (error) {
      console.warn('Failed to get connection stats:', error);
    }
  }

  // Public methods that delegate to VideoServiceManager
  sendMessage(message: string): void {
    this.videoServiceManager?.sendMessage(message);
  }

  async toggleAudio(): Promise<boolean | undefined> {
    console.log('🎤 IntelligentVideoManager: toggleAudio called');
    if (this.videoServiceManager) {
      const result = await this.videoServiceManager.toggleAudio();
      console.log(`🎤 IntelligentVideoManager: toggleAudio result: ${result}`);
      return result;
    } else {
      console.warn('🎤 IntelligentVideoManager: No video service manager available');
      return undefined;
    }
  }

  async toggleVideo(): Promise<boolean | undefined> {
    console.log('📹 IntelligentVideoManager: toggleVideo called');
    if (this.videoServiceManager) {
      const result = await this.videoServiceManager.toggleVideo();
      console.log(`📹 IntelligentVideoManager: toggleVideo result: ${result}`);
      return result;
    } else {
      console.warn('📹 IntelligentVideoManager: No video service manager available');
      return undefined;
    }
  }

  hangup(): void {
    this.videoServiceManager?.hangup();
  }

  dispose(): void {
    // Clear intervals
    if (this.backgroundMonitoringInterval) {
      clearInterval(this.backgroundMonitoringInterval);
      this.backgroundMonitoringInterval = null;
    }
    
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
      this.qualityCheckInterval = null;
    }
    
    // Dispose video service manager
    this.videoServiceManager?.dispose();
    this.videoServiceManager = null;
    
    this.isInitialized = false;
  }

  getCurrentProvider(): VideoProvider | null {
    return this.currentProvider;
  }

  isConnected(): boolean {
    return this.videoServiceManager?.isConnected() || false;
  }

  async getConnectionStats(): Promise<any> {
    return await this.videoServiceManager?.getConnectionStats();
  }

  getProviderPerformance(): ProviderPerformance[] {
    return Array.from(this.providerPerformance.values());
  }

  // Force manual provider switch
  async switchToProvider(provider: VideoProvider): Promise<void> {
    if (this.videoServiceManager) {
      await this.videoServiceManager.switchToProvider(provider);
    }
  }

  // Get current audio/video states
  getCurrentStates(): { isAudioMuted: boolean; isVideoOff: boolean } {
    console.log('🔧 IntelligentVideoManager: getCurrentStates called');
    if (this.videoServiceManager) {
      return this.videoServiceManager.getCurrentStates();
    } else {
      console.warn('🔧 IntelligentVideoManager: No video service manager available for getCurrentStates');
      return {
        isAudioMuted: false,
        isVideoOff: false
      };
    }
  }

  // Set initial mute states (call after initialization)
  async setInitialMuteStates(audioMuted: boolean, videoOff: boolean): Promise<void> {
    console.log(`🔧 IntelligentVideoManager: Setting initial mute states - audio: ${audioMuted}, video: ${videoOff}`);
    if (this.videoServiceManager) {
      await this.videoServiceManager.setInitialMuteStates(audioMuted, videoOff);
    } else {
      console.warn('🔧 IntelligentVideoManager: No video service manager available for setInitialMuteStates');
    }
  }

  // Manual retry with current provider
  async retry(): Promise<void> {
    if (this.videoServiceManager) {
      await this.videoServiceManager.retry();
    }
  }

  // Get current video service manager for direct access
  getCurrentManager(): VideoServiceManager | null {
    return this.videoServiceManager;
  }

  // Send device info to remote participants
  sendDeviceInfo(deviceInfo: any): void {
    console.log('📱 IntelligentVideoManager: Sending device info:', deviceInfo);
    if (this.videoServiceManager) {
      this.videoServiceManager.sendDeviceInfo(deviceInfo);
    } else {
      console.warn('📱 IntelligentVideoManager: No video service manager available for sendDeviceInfo');
    }
  }

  private stopBackgroundMonitoring(): void {
    if (this.backgroundMonitoringInterval) {
      clearInterval(this.backgroundMonitoringInterval);
      this.backgroundMonitoringInterval = null;
    }
    
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
      this.qualityCheckInterval = null;
    }
  }
}