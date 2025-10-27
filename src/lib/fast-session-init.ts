/**
 * Fast Session Initialization
 * Parallel operations and smart defaults for rapid session startup
 */

import { IntelligentVideoManager, type IntelligentVideoCallbacks } from './intelligent-video-manager';
import { FixedWebRTCManager, type WebRTCCallbacks } from './fixed-webrtc-manager';
import { createMessagingService, type MessageCallback } from './messaging-service';
import { topicService } from './supabase-services';
import { OrientationAdapter } from './migrate-to-simple-orientation';
import { mediaStreamController } from './media-stream-controller';
import { performanceMonitor, startMetric, endMetric, recordOptimization } from './performance-monitor';

export interface FastInitConfig {
  sessionId: string;
  userId: string;
  userProfile: any;
  otherUserId?: string;
  skipSafetyDisclaimer?: boolean;
  skipCameraPreview?: boolean;
  enableFastTrack?: boolean;
  cachedProviderPreference?: string;
}

export interface FastInitResult {
  sessionData: any;
  cameraStream: MediaStream | null;
  videoManager: any;
  messagingService: any;
  deviceInfo: any;
  initTime: number;
  usedFastTrack: boolean;
}

export interface InitProgress {
  step: string;
  progress: number;
  message: string;
  timestamp: number;
}

export class FastSessionInitializer {
  private static cache = new Map<string, any>();
  private static userPreferences = new Map<string, any>();
  
  /**
   * Fast parallel initialization of all session components
   */
  static async initializeSession(
    config: FastInitConfig,
    callbacks: {
      video: IntelligentVideoCallbacks;
      webrtc: WebRTCCallbacks;
      messaging: MessageCallback;
      onProgress?: (progress: InitProgress) => void;
    }
  ): Promise<FastInitResult> {
    const startTime = Date.now();
    const { onProgress } = callbacks;
    
    // Start performance monitoring
    performanceMonitor.clearMetrics();
    startMetric('total_init', { fastTrack: config.enableFastTrack });
    
    console.log('🚀 FastSessionInitializer: Starting parallel initialization');
    
    // Check if we can use fast-track mode
    const canUseFastTrack = this.canUseFastTrack(config);
    
    if (canUseFastTrack) {
      recordOptimization('Fast-track mode enabled');
    }
    
    onProgress?.({
      step: 'starting',
      progress: 0,
      message: canUseFastTrack ? 'Fast-track mode enabled ⚡' : 'Standard initialization',
      timestamp: Date.now()
    });

    try {
      // Phase 1: Start all operations in parallel
      const parallelOperations = await this.startParallelOperations(config, callbacks, onProgress);
      
      // Phase 2: Process results and create managers
      const result = await this.processResults(config, parallelOperations, callbacks, onProgress);
      
      const totalTime = Date.now() - startTime;
      endMetric('total_init', { success: true });
      
      // Generate performance report
      const report = performanceMonitor.generateReport(config.sessionId, config.userId);
      
      console.log(`🚀 FastSessionInitializer: Completed in ${totalTime}ms`);
      
      onProgress?.({
        step: 'complete',
        progress: 100,
        message: `Ready in ${totalTime}ms ${canUseFastTrack ? '⚡' : ''}`,
        timestamp: Date.now()
      });
      
      return {
        ...result,
        initTime: totalTime,
        usedFastTrack: canUseFastTrack
      };
      
    } catch (error) {
      console.error('🚀 FastSessionInitializer: Failed:', error);
      throw error;
    }
  }
  
  /**
   * Start all initialization operations in parallel
   */
  private static async startParallelOperations(
    config: FastInitConfig,
    callbacks: any,
    onProgress?: (progress: InitProgress) => void
  ) {
    onProgress?.({
      step: 'parallel_start',
      progress: 10,
      message: 'Starting parallel operations...',
      timestamp: Date.now()
    });
    
    // Start all operations simultaneously
    const operations = {
      sessionData: this.loadSessionData(config.sessionId),
      cameraStream: this.initializeCamera(config),
      providerTest: this.testProviders(config),
      messagingService: this.initializeMessaging(config, callbacks.messaging),
      deviceInfo: this.getDeviceInfo(),
      userPreferences: this.loadUserPreferences(config.userId)
    };
    
    // Wait for all critical operations (allow some to fail)
    const results = await Promise.allSettled([
      operations.sessionData,
      operations.cameraStream,
      operations.providerTest,
      operations.messagingService,
      operations.deviceInfo,
      operations.userPreferences
    ]);
    
    onProgress?.({
      step: 'parallel_complete',
      progress: 60,
      message: 'Parallel operations completed',
      timestamp: Date.now()
    });
    
    return {
      sessionData: this.getResult(results[0]),
      cameraStream: this.getResult(results[1]),
      providerTest: this.getResult(results[2]),
      messagingService: this.getResult(results[3]),
      deviceInfo: this.getResult(results[4]),
      userPreferences: this.getResult(results[5])
    };
  }
  
  /**
   * Process parallel operation results and create managers
   */
  private static async processResults(
    config: FastInitConfig,
    results: any,
    callbacks: any,
    onProgress?: (progress: InitProgress) => void
  ) {
    onProgress?.({
      step: 'processing',
      progress: 70,
      message: 'Creating video manager...',
      timestamp: Date.now()
    });
    
    // Create video manager based on results
    const videoManager = await this.createOptimalVideoManager(
      config,
      results.providerTest,
      results.userPreferences,
      callbacks.video,
      callbacks.webrtc
    );
    
    // Set up media stream controller if we have a camera stream
    if (results.cameraStream) {
      mediaStreamController.setStream(results.cameraStream);
    }
    
    onProgress?.({
      step: 'finalizing',
      progress: 90,
      message: 'Finalizing setup...',
      timestamp: Date.now()
    });
    
    return {
      sessionData: results.sessionData,
      cameraStream: results.cameraStream,
      videoManager,
      messagingService: results.messagingService,
      deviceInfo: results.deviceInfo
    };
  }
  
  /**
   * Load session data with caching
   */
  private static async loadSessionData(sessionId: string) {
    startMetric('session_data');
    const cacheKey = `session_${sessionId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30000) { // 30 second cache
        console.log('📋 Using cached session data');
        recordOptimization('Session data cache hit');
        endMetric('session_data', { cached: true });
        return cached.data;
      }
    }
    
    console.log('📋 Loading session data...');
    const topics = await topicService.getAllTopics();
    const sessionData = topics.find(t => t.id === sessionId);
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: sessionData,
      timestamp: Date.now()
    });
    
    endMetric('session_data', { cached: false });
    return sessionData;
  }
  
  /**
   * Initialize camera with smart constraints
   */
  private static async initializeCamera(config: FastInitConfig): Promise<MediaStream | null> {
    if (config.skipCameraPreview) {
      console.log('📷 Skipping camera initialization (fast-track mode)');
      return null;
    }
    
    console.log('📷 Initializing camera with smart constraints...');
    
    try {
      // Use cached constraints if available
      const cachedConstraints = this.getCachedConstraints(config.userId);
      if (cachedConstraints) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(cachedConstraints);
          console.log('📷 Camera initialized with cached constraints');
          return stream;
        } catch (error) {
          console.log('📷 Cached constraints failed, trying optimal constraints');
        }
      }
      
      // Get optimal constraints based on device/browser
      const constraints = this.getOptimalConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Cache successful constraints
      this.cacheConstraints(config.userId, constraints);
      
      console.log('📷 Camera initialized with optimal constraints');
      return stream;
      
    } catch (error) {
      console.error('📷 Camera initialization failed:', error);
      return null;
    }
  }
  
  /**
   * Test video providers in background
   */
  private static async testProviders(config: FastInitConfig) {
    console.log('🧪 Testing video providers...');
    
    // Check cached provider performance
    const cachedProvider = this.getCachedProvider(config.userId);
    if (cachedProvider && this.isProviderCacheValid(cachedProvider)) {
      console.log('🧪 Using cached provider preference:', cachedProvider.provider);
      return cachedProvider;
    }
    
    // Quick provider availability test (not full initialization)
    const providerTests = await Promise.allSettled([
      this.quickTestProvider('webrtc'),
      this.quickTestProvider('jitsi-public'),
      this.quickTestProvider('daily')
    ]);
    
    const availableProviders = providerTests
      .map((result, index) => ({
        provider: ['webrtc', 'jitsi-public', 'daily'][index],
        available: result.status === 'fulfilled'
      }))
      .filter(p => p.available);
    
    // Default to WebRTC (fastest) if available
    const preferredProvider = availableProviders.find(p => p.provider === 'webrtc') || availableProviders[0];
    
    if (preferredProvider) {
      this.cacheProvider(config.userId, preferredProvider.provider);
    }
    
    console.log('🧪 Provider testing complete, preferred:', preferredProvider?.provider);
    return preferredProvider;
  }
  
  /**
   * Initialize messaging service
   */
  private static async initializeMessaging(config: FastInitConfig, callbacks: MessageCallback) {
    console.log('💬 Initializing messaging service...');
    
    try {
      const messagingService = createMessagingService(
        config.sessionId,
        config.userId,
        config.userProfile?.display_name || 'You',
        callbacks
      );
      
      console.log('💬 Messaging service initialized');
      return messagingService;
    } catch (error) {
      console.error('💬 Messaging service failed:', error);
      return null;
    }
  }
  
  /**
   * Get device info
   */
  private static async getDeviceInfo() {
    console.log('📱 Getting device info...');
    return OrientationAdapter.getDeviceInfo();
  }
  
  /**
   * Load user preferences
   */
  private static async loadUserPreferences(userId: string) {
    const preferences = this.userPreferences.get(userId) || {
      skipSafetyDisclaimer: false,
      skipCameraPreview: false,
      preferredProvider: null,
      autoJoin: true
    };
    
    console.log('⚙️ Loaded user preferences:', preferences);
    return preferences;
  }
  
  /**
   * Create optimal video manager based on test results
   */
  private static async createOptimalVideoManager(
    config: FastInitConfig,
    providerTest: any,
    userPreferences: any,
    videoCallbacks: IntelligentVideoCallbacks,
    webrtcCallbacks: WebRTCCallbacks
  ) {
    console.log('🎥 Creating optimal video manager...');
    
    const preferredProvider = providerTest?.provider || 'webrtc';
    
    if (preferredProvider === 'webrtc' || !providerTest) {
      // Use WebRTC directly (fastest option)
      console.log('🎥 Using WebRTC manager (fastest)');
      return new FixedWebRTCManager(
        config.sessionId,
        config.userId,
        config.userProfile?.display_name || 'You',
        config.otherUserId || '',
        webrtcCallbacks
      );
    } else {
      // Use IntelligentVideoManager with preferred provider
      console.log('🎥 Using IntelligentVideoManager with preferred provider:', preferredProvider);
      const videoConfig = {
        sessionId: config.sessionId,
        displayName: config.userProfile?.display_name || 'You',
        email: config.userProfile?.email,
        avatarUrl: config.userProfile?.avatar_url
      };
      
      return new IntelligentVideoManager(videoConfig, videoCallbacks);
    }
  }
  
  /**
   * Utility methods
   */
  private static canUseFastTrack(config: FastInitConfig): boolean {
    return config.enableFastTrack && 
           this.hasValidCache(config.userId) &&
           this.hasPermissions();
  }
  
  private static hasValidCache(userId: string): boolean {
    return this.userPreferences.has(userId) && 
           this.cache.has(`constraints_${userId}`);
  }
  
  private static hasPermissions(): boolean {
    // Check if we likely have camera/mic permissions
    return typeof navigator !== 'undefined' && 
           'mediaDevices' in navigator;
  }
  
  private static getResult(settledResult: PromiseSettledResult<any>) {
    return settledResult.status === 'fulfilled' ? settledResult.value : null;
  }
  
  private static getOptimalConstraints(): MediaStreamConstraints {
    // Smart constraints based on browser/device detection
    const isChrome = navigator.userAgent.includes('Chrome');
    const isSafari = navigator.userAgent.includes('Safari') && !isChrome;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      return {
        video: {
          facingMode: 'user',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 24, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      };
    } else {
      return {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
    }
  }
  
  private static getCachedConstraints(userId: string): MediaStreamConstraints | null {
    return this.cache.get(`constraints_${userId}`)?.constraints || null;
  }
  
  private static cacheConstraints(userId: string, constraints: MediaStreamConstraints) {
    this.cache.set(`constraints_${userId}`, {
      constraints,
      timestamp: Date.now()
    });
  }
  
  private static getCachedProvider(userId: string) {
    return this.cache.get(`provider_${userId}`);
  }
  
  private static cacheProvider(userId: string, provider: string) {
    this.cache.set(`provider_${userId}`, {
      provider,
      timestamp: Date.now()
    });
  }
  
  private static isProviderCacheValid(cached: any): boolean {
    return Date.now() - cached.timestamp < 300000; // 5 minute cache
  }
  
  private static async quickTestProvider(provider: string): Promise<boolean> {
    // Quick availability test without full initialization
    switch (provider) {
      case 'webrtc':
        return 'RTCPeerConnection' in window;
      case 'jitsi-public':
        return true; // Always available
      case 'daily':
        return true; // Always available
      default:
        return false;
    }
  }
  
  /**
   * Update user preferences
   */
  static updateUserPreferences(userId: string, preferences: Partial<any>) {
    const current = this.userPreferences.get(userId) || {};
    this.userPreferences.set(userId, { ...current, ...preferences });
  }
  
  /**
   * Clear cache (for testing)
   */
  static clearCache() {
    this.cache.clear();
    this.userPreferences.clear();
  }
}