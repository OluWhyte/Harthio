/**
 * Video Layout Manager
 * Handles dynamic video layout adjustments based on device orientations
 * Provides smooth transitions and optimal display for different device combinations
 */

import { DeviceVideoMetadata } from './device-orientation-service';

export interface VideoLayoutConfig {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  localContainerRef?: React.RefObject<HTMLDivElement>;
  remoteContainerRef?: React.RefObject<HTMLDivElement>;
}

export class VideoLayoutManager {
  private config: VideoLayoutConfig;
  private localMetadata: DeviceVideoMetadata | null = null;
  private remoteMetadata: DeviceVideoMetadata | null = null;

  constructor(config: VideoLayoutConfig) {
    this.config = config;
  }

  /**
   * Update local device metadata and adjust layout
   */
  updateLocalMetadata(metadata: DeviceVideoMetadata): void {
    console.log('📱 Updating local video layout:', metadata);
    this.localMetadata = metadata;
    this.applyLocalVideoLayout();
  }

  /**
   * Update remote device metadata and adjust layout
   */
  updateRemoteMetadata(metadata: DeviceVideoMetadata): void {
    console.log('📱 Updating remote video layout:', metadata);
    this.remoteMetadata = metadata;
    this.applyRemoteVideoLayout();
  }

  /**
   * Apply layout for local video (picture-in-picture)
   */
  private applyLocalVideoLayout(): void {
    const localVideo = this.config.localVideoRef.current;
    const localContainer = this.config.localContainerRef?.current;
    
    if (!localVideo || !this.localMetadata) return;

    console.log('🎥 Applying local video layout for:', this.localMetadata.orientation);

    // Apply video element styles
    this.applyVideoStyles(localVideo, this.localMetadata, 'local');

    // Apply container styles if available
    if (localContainer) {
      this.applyContainerStyles(localContainer, this.localMetadata, 'local');
    }
  }

  /**
   * Apply layout for remote video (main video)
   */
  private applyRemoteVideoLayout(): void {
    const remoteVideo = this.config.remoteVideoRef.current;
    const remoteContainer = this.config.remoteContainerRef?.current;
    
    if (!remoteVideo || !this.remoteMetadata) return;

    console.log('🎥 Applying remote video layout for:', this.remoteMetadata.orientation);

    // Apply video element styles
    this.applyVideoStyles(remoteVideo, this.remoteMetadata, 'remote');

    // Apply container styles if available
    if (remoteContainer) {
      this.applyContainerStyles(remoteContainer, this.remoteMetadata, 'remote');
    }
  }

  /**
   * Apply styles to video element based on metadata
   */
  private applyVideoStyles(
    videoElement: HTMLVideoElement, 
    metadata: DeviceVideoMetadata, 
    type: 'local' | 'remote'
  ): void {
    const isPortrait = metadata.orientation === 'portrait';
    const isMobile = metadata.deviceType === 'mobile';
    
    // Base styles
    videoElement.style.transition = 'all 0.3s ease-in-out';
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';

    if (type === 'remote') {
      // Remote video (main video) styling
      if (isPortrait && isMobile) {
        // Remote user is on mobile portrait - show full video with letterboxing
        videoElement.style.objectFit = 'contain';
        videoElement.style.backgroundColor = '#000';
        console.log('📱 Remote: Mobile portrait → contain mode');
      } else {
        // Remote user is on desktop/landscape - fill the screen
        videoElement.style.objectFit = 'cover';
        videoElement.style.backgroundColor = 'transparent';
        console.log('💻 Remote: Desktop/landscape → cover mode');
      }
    } else {
      // Local video (PiP) styling
      videoElement.style.objectFit = 'cover'; // PiP always uses cover
      videoElement.style.borderRadius = '8px';
      console.log('📹 Local: PiP → cover mode');
    }

    // Add aspect ratio hint for better rendering
    if (metadata.videoWidth && metadata.videoHeight) {
      const aspectRatio = metadata.videoWidth / metadata.videoHeight;
      videoElement.style.aspectRatio = aspectRatio.toFixed(2);
    }
  }

  /**
   * Apply styles to container element based on metadata
   */
  private applyContainerStyles(
    containerElement: HTMLDivElement, 
    metadata: DeviceVideoMetadata, 
    type: 'local' | 'remote'
  ): void {
    containerElement.style.transition = 'all 0.3s ease-in-out';

    if (type === 'local') {
      // Local container (PiP) adjustments
      this.adjustLocalContainer(containerElement, metadata);
    } else {
      // Remote container (main video) adjustments
      this.adjustRemoteContainer(containerElement, metadata);
    }
  }

  /**
   * Adjust local video container (Picture-in-Picture)
   */
  private adjustLocalContainer(container: HTMLDivElement, metadata: DeviceVideoMetadata): void {
    const isPortrait = metadata.orientation === 'portrait';
    const isMobile = metadata.deviceType === 'mobile';

    if (isMobile) {
      if (isPortrait) {
        // Mobile portrait: smaller PiP, bottom right
        container.className = container.className.replace(
          /w-\d+|h-\d+/g, ''
        ) + ' w-24 h-32';
        console.log('📱 Local PiP: Mobile portrait → small size');
      } else {
        // Mobile landscape: wider PiP
        container.className = container.className.replace(
          /w-\d+|h-\d+/g, ''
        ) + ' w-32 h-24';
        console.log('📱 Local PiP: Mobile landscape → wide size');
      }
    } else {
      // Desktop: standard PiP size
      container.className = container.className.replace(
        /w-\d+|h-\d+/g, ''
      ) + ' w-64 h-48';
      console.log('💻 Local PiP: Desktop → standard size');
    }
  }

  /**
   * Adjust remote video container (Main video)
   */
  private adjustRemoteContainer(container: HTMLDivElement, metadata: DeviceVideoMetadata): void {
    const isPortrait = metadata.orientation === 'portrait';
    
    if (isPortrait) {
      // Remote is portrait: add subtle styling hints
      container.style.background = 'linear-gradient(135deg, #1f2937 0%, #111827 100%)';
      console.log('📱 Remote container: Portrait mode styling');
    } else {
      // Remote is landscape: standard styling
      container.style.background = '';
      console.log('💻 Remote container: Landscape mode styling');
    }
  }

  /**
   * Get layout information for debugging
   */
  getLayoutInfo(): {
    local: DeviceVideoMetadata | null;
    remote: DeviceVideoMetadata | null;
    combination: string;
  } {
    const combination = this.getDeviceCombination();
    
    return {
      local: this.localMetadata,
      remote: this.remoteMetadata,
      combination
    };
  }

  /**
   * Get human-readable device combination
   */
  private getDeviceCombination(): string {
    if (!this.localMetadata || !this.remoteMetadata) {
      return 'Unknown combination';
    }

    const local = `${this.localMetadata.deviceType}-${this.localMetadata.orientation}`;
    const remote = `${this.remoteMetadata.deviceType}-${this.remoteMetadata.orientation}`;
    
    return `Local: ${local}, Remote: ${remote}`;
  }

  /**
   * Reset all video layouts to default
   */
  resetLayouts(): void {
    console.log('🔄 Resetting video layouts to default');
    
    const localVideo = this.config.localVideoRef.current;
    const remoteVideo = this.config.remoteVideoRef.current;

    if (localVideo) {
      localVideo.style.objectFit = 'cover';
      localVideo.style.aspectRatio = '';
      localVideo.style.backgroundColor = '';
    }

    if (remoteVideo) {
      remoteVideo.style.objectFit = 'cover';
      remoteVideo.style.aspectRatio = '';
      remoteVideo.style.backgroundColor = '';
    }

    this.localMetadata = null;
    this.remoteMetadata = null;
  }
}