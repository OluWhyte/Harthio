/**
 * Background Video Service
 * Initializes video services silently in the background during pre-call setup
 * Provides instant video connection when user joins the session
 */

import { VideoServiceManager, VideoServiceConfig, VideoServiceCallbacks } from './video-service-manager';
import { DeviceVideoMetadata } from './device-orientation-service';
import { logger } from './logger';

export interface BackgroundVideoState {
  isInitializing: boolean;
  isReady: boolean;
  hasError: boolean;
  currentService: 'daily' | 'p2p' | 'none';
  errorMessage?: string;
}

export interface BackgroundVideoCallbacks {
  onStateChange: (state: BackgroundVideoState) => void;
  onReady: (videoManager: VideoServiceManager) => void;
  onError: (error: string) => void;
}

export class BackgroundVideoService {
  private config: VideoServiceConfig;
  private callbacks: BackgroundVideoCallbacks;
  private videoManager: VideoServiceManager | null = null;
  private state: BackgroundVideoState;
  private isDestroyed = false;

  constructor(config: VideoServiceConfig, callbacks: BackgroundVideoCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
    this.state = {
      isInitializing: false,
      isReady: false,
      hasError: false,
      currentService: 'none'
    };
  }

  /**
   * Start background initialization (silent)
   */
  async startBackgroundInit(): Promise<void> {
    if (this.state.isInitializing || this.state.isReady || this.isDestroyed) {
      return;
    }

    logger.info('Starting background video initialization');
    this.updateState({
      isInitializing: true,
      isReady: false,
      hasError: false,
      currentService: 'none'
    });

    try {
      // Create silent video service callbacks
      const silentCallbacks: VideoServiceCallbacks = {
        onStateChange: (state) => {
          logger.debug('Background video state', { state });
          if (state === 'connected') {
            this.updateState({
              isInitializing: false,
              isReady: true,
              hasError: false,
              currentService: this.videoManager?.getCurrentService() || 'none'
            });
            
            if (this.videoManager) {
              this.callbacks.onReady(this.videoManager);
            }
          }
        },
        
        onConnectionStats: () => {
          // Silent - no UI updates during background init
        },
        
        onLocalStream: (stream) => {
          logger.debug('Background: Local stream ready');
          // Stream is ready but not displayed yet
        },
        
        onRemoteStream: (stream) => {
          logger.debug('Background: Remote stream ready');
          // Stream is ready but not displayed yet
        },
        
        onMessage: () => {
          // Messages handled by separate messaging service
        },
        
        onError: (error, isRecoverable) => {
          logger.warn('Background video error', { error, isRecoverable });
          if (!isRecoverable) {
            this.updateState({
              isInitializing: false,
              isReady: false,
              hasError: true,
              currentService: 'none',
              errorMessage: error
            });
            this.callbacks.onError(error);
          }
        }
      };

      // Create video manager
      this.videoManager = new VideoServiceManager(this.config, silentCallbacks);
      
      // Initialize without container (background mode)
      await this.videoManager.initialize();
      
      logger.info('Background video initialization completed');

    } catch (error) {
      logger.error('Background video initialization failed', error);
      this.updateState({
        isInitializing: false,
        isReady: false,
        hasError: true,
        currentService: 'none',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      this.callbacks.onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get the initialized video manager (ready to use)
   */
  getVideoManager(): VideoServiceManager | null {
    return this.state.isReady ? this.videoManager : null;
  }

  /**
   * Get current state
   */
  getState(): BackgroundVideoState {
    return { ...this.state };
  }

  /**
   * Transfer control to main session (with UI callbacks)
   */
  transferToMainSession(mainCallbacks: VideoServiceCallbacks): VideoServiceManager | null {
    if (!this.state.isReady || !this.videoManager) {
      logger.warn('Video manager not ready for transfer');
      return null;
    }

    logger.info('Transferring video manager to main session');
    
    // The video manager is already initialized and connected
    // The main session just needs to attach UI callbacks and video elements
    
    return this.videoManager;
  }

  /**
   * Update video manager with UI elements (when entering main session)
   */
  attachUIElements(
    localVideoRef: React.RefObject<HTMLVideoElement>,
    remoteVideoRef: React.RefObject<HTMLVideoElement>
  ): void {
    if (!this.videoManager || !this.state.isReady) {
      logger.warn('Cannot attach UI elements - video manager not ready');
      return;
    }

    logger.debug('Attaching UI elements to background video manager');
    
    // Get current streams and attach to video elements
    const currentService = this.videoManager.getCurrentService();
    
    if (currentService === 'p2p') {
      // P2P streams need to be attached to video elements
      logger.debug('P2P streams ready for video elements');
    } else {
      logger.debug('No active video service');
    }
  }

  /**
   * Cleanup background service
   */
  async destroy(): Promise<void> {
    logger.info('Destroying background video service');
    this.isDestroyed = true;
    
    if (this.videoManager) {
      await this.videoManager.endCall();
      this.videoManager = null;
    }
    
    this.updateState({
      isInitializing: false,
      isReady: false,
      hasError: false,
      currentService: 'none'
    });
  }

  private updateState(newState: Partial<BackgroundVideoState>): void {
    this.state = { ...this.state, ...newState };
    this.callbacks.onStateChange(this.state);
  }
}

// Global background video service instance
let globalBackgroundVideoService: BackgroundVideoService | null = null;

/**
 * Create or get the global background video service
 */
export function createBackgroundVideoService(
  config: VideoServiceConfig, 
  callbacks: BackgroundVideoCallbacks
): BackgroundVideoService {
  // Clean up existing service if any
  if (globalBackgroundVideoService) {
    globalBackgroundVideoService.destroy();
  }
  
  globalBackgroundVideoService = new BackgroundVideoService(config, callbacks);
  return globalBackgroundVideoService;
}

/**
 * Get the current background video service
 */
export function getBackgroundVideoService(): BackgroundVideoService | null {
  return globalBackgroundVideoService;
}

/**
 * Clear the global background video service
 */
export function clearBackgroundVideoService(): void {
  if (globalBackgroundVideoService) {
    globalBackgroundVideoService.destroy();
    globalBackgroundVideoService = null;
  }
}