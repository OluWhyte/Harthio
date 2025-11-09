/**
 * Connection Quality Service
 * Monitors and reports network conditions to help with provider selection
 * 
 * BANDWIDTH MANAGEMENT PHILOSOPHY:
 * ================================
 * This service measures network conditions for PROVIDER SELECTION only.
 * It does NOT set bitrates or interfere with native browser bandwidth adaptation.
 * 
 * The bandwidth measurements here are used to:
 * - Choose between video providers (currently only P2P available)
 * - Provide network quality feedback to users
 * - Select appropriate video providers based on network capabilities
 * 
 * The actual video quality adaptation is handled by:
 * - Browser's native TWCC (Transport Wide Congestion Control)
 * - WebRTC's built-in bandwidth estimation
 * - Real-time encoding parameter adjustments by the browser
 */

export interface NetworkConditions {
  bandwidth: number; // Mbps
  latency: number; // ms
  packetLoss: number; // percentage
  connectionType: string;
  isStable: boolean;
}

export interface QualityRecommendation {
  // COMMENTED OUT: Daily.co not currently used
  // preferredProvider: 'daily' | 'p2p';
  preferredProvider: 'p2p'; // Only P2P available for now
  videoQuality: 'high' | 'medium' | 'low';
  reason: string;
  confidence: number; // 0-1
}

export class ConnectionQualityService {
  private static instance: ConnectionQualityService;
  private conditions: NetworkConditions | null = null;
  private isMonitoring = false;
  private callbacks: ((conditions: NetworkConditions) => void)[] = [];

  static getInstance(): ConnectionQualityService {
    if (!ConnectionQualityService.instance) {
      ConnectionQualityService.instance = new ConnectionQualityService();
    }
    return ConnectionQualityService.instance;
  }

  async assessNetworkConditions(): Promise<NetworkConditions> {
    try {
      // Test 1: Latency test
      const latency = await this.measureLatency();
      
      // Test 2: Bandwidth estimation
      const bandwidth = await this.estimateBandwidth();
      
      // Test 3: Connection stability
      const isStable = await this.testStability();
      
      // Test 4: Connection type detection
      const connectionType = this.detectConnectionType();
      
      // Packet loss is harder to measure directly, estimate based on other factors
      const packetLoss = this.estimatePacketLoss(latency, isStable);

      this.conditions = {
        bandwidth,
        latency,
        packetLoss,
        connectionType,
        isStable
      };

      // Notify callbacks
      this.callbacks.forEach(callback => callback(this.conditions!));

      return this.conditions;

    } catch (error) {
      console.error('Failed to assess network conditions:', error);
      
      // Return conservative estimates
      return {
        bandwidth: 1,
        latency: 500,
        packetLoss: 5,
        connectionType: 'unknown',
        isStable: false
      };
    }
  }

  private async measureLatency(): Promise<number> {
    const measurements: number[] = [];
    
    for (let i = 0; i < 3; i++) {
      try {
        const start = performance.now();
        
        await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        
        const latency = performance.now() - start;
        measurements.push(latency);
        
        // Small delay between measurements
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        measurements.push(1000); // Assume high latency on error
      }
    }
    
    // Return median to avoid outliers
    measurements.sort((a, b) => a - b);
    return measurements[Math.floor(measurements.length / 2)];
  }

  private async estimateBandwidth(): Promise<number> {
    try {
      // Use Network Information API if available
      const connection = (navigator as any).connection;
      if (connection && connection.downlink) {
        return connection.downlink;
      }

      // Fallback: Download a small test file and measure speed
      const testSize = 50 * 1024; // 50KB test
      const start = performance.now();
      
      const response = await fetch('/api/health', {
        cache: 'no-cache'
      });
      
      await response.text();
      const duration = (performance.now() - start) / 1000; // seconds
      
      // Estimate bandwidth (very rough)
      const estimatedBandwidth = (testSize * 8) / (duration * 1024 * 1024); // Mbps
      
      return Math.max(0.5, Math.min(estimatedBandwidth, 100)); // Clamp between 0.5-100 Mbps
      
    } catch (error) {
      console.error('Bandwidth estimation failed:', error);
      return 1; // Conservative estimate
    }
  }

  private async testStability(): Promise<boolean> {
    try {
      const tests: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        
        try {
          await fetch('/api/health', {
            method: 'HEAD',
            cache: 'no-cache'
          });
          
          const latency = performance.now() - start;
          tests.push(latency);
          
        } catch (error) {
          tests.push(2000); // High latency for failed requests
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Check variance - stable connections have low variance
      const mean = tests.reduce((a, b) => a + b) / tests.length;
      const variance = tests.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / tests.length;
      const stdDev = Math.sqrt(variance);
      
      // Consider stable if standard deviation is less than 30% of mean
      return stdDev < (mean * 0.3);
      
    } catch (error) {
      return false;
    }
  }

  private detectConnectionType(): string {
    try {
      const connection = (navigator as any).connection;
      if (connection) {
        return connection.effectiveType || connection.type || 'unknown';
      }
      
      // Fallback detection based on user agent
      const userAgent = navigator.userAgent;
      if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
        return 'mobile';
      }
      
      return 'unknown';
      
    } catch (error) {
      return 'unknown';
    }
  }

  private estimatePacketLoss(latency: number, isStable: boolean): number {
    // Rough estimation based on latency and stability
    let packetLoss = 0;
    
    if (latency > 500) packetLoss += 3;
    if (latency > 1000) packetLoss += 5;
    if (!isStable) packetLoss += 2;
    
    return Math.min(packetLoss, 15); // Cap at 15%
  }

  getProviderRecommendation(conditions?: NetworkConditions): QualityRecommendation {
    const networkConditions = conditions || this.conditions;
    
    if (!networkConditions) {
      return {
        preferredProvider: 'p2p',
        videoQuality: 'medium',
        reason: 'Network conditions unknown, using safe defaults',
        confidence: 0.3
      };
    }

    const { bandwidth, latency, packetLoss, connectionType, isStable } = networkConditions;

    // Excellent conditions - P2P works well
    if (bandwidth >= 3 && latency < 150 && packetLoss < 2 && isStable) {
      return {
        // COMMENTED OUT: Daily.co not currently used
        // preferredProvider: 'daily',
        preferredProvider: 'p2p',
        videoQuality: 'high',
        reason: 'Excellent network conditions detected',
        confidence: 0.9
      };
    }

    // Good conditions - P2P works well and reduces server load
    if (bandwidth >= 1.5 && latency < 300 && packetLoss < 5) {
      return {
        preferredProvider: 'p2p',
        videoQuality: bandwidth >= 2.5 ? 'high' : 'medium',
        reason: 'Good conditions for peer-to-peer connection',
        confidence: 0.8
      };
    }

    // Moderate conditions - P2P with reduced quality
    if (bandwidth >= 0.8 && latency < 500 && packetLoss < 8) {
      return {
        preferredProvider: 'p2p',
        videoQuality: 'low',
        reason: 'Limited bandwidth, reducing video quality',
        confidence: 0.6
      };
    }

    // Poor conditions - use P2P with low quality
    return {
      preferredProvider: 'p2p',
      videoQuality: 'low',
      reason: 'Poor network conditions, using P2P with reduced quality',
      confidence: 0.7
    };
  }

  startMonitoring(callback: (conditions: NetworkConditions) => void): void {
    this.callbacks.push(callback);
    
    if (!this.isMonitoring) {
      this.isMonitoring = true;
      this.monitoringLoop();
    }
  }

  stopMonitoring(callback?: (conditions: NetworkConditions) => void): void {
    if (callback) {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    } else {
      this.callbacks = [];
    }
    
    if (this.callbacks.length === 0) {
      this.isMonitoring = false;
    }
  }

  private async monitoringLoop(): Promise<void> {
    while (this.isMonitoring) {
      try {
        await this.assessNetworkConditions();
        await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30 seconds
      } catch (error) {
        console.error('Network monitoring error:', error);
        await new Promise(resolve => setTimeout(resolve, 60000)); // Retry after 1 minute on error
      }
    }
  }

  getCurrentConditions(): NetworkConditions | null {
    return this.conditions;
  }

  // Utility method for setup page
  async getSetupRecommendations(): Promise<{
    canUseVideo: boolean;
    recommendedQuality: string;
    warnings: string[];
    tips: string[];
  }> {
    const conditions = await this.assessNetworkConditions();
    const recommendation = this.getProviderRecommendation(conditions);
    
    const warnings: string[] = [];
    const tips: string[] = [];
    
    if (conditions.latency > 300) {
      warnings.push('High latency detected - video may have delays');
      tips.push('Try moving closer to your WiFi router or switching to a wired connection');
    }
    
    if (conditions.bandwidth < 1.5) {
      warnings.push('Limited bandwidth - video quality will be reduced');
      tips.push('Close other applications using internet and consider using WiFi');
    }
    
    if (!conditions.isStable) {
      warnings.push('Unstable connection detected');
      tips.push('Try switching between WiFi and mobile data to find the most stable option');
    }
    
    if (conditions.connectionType.includes('2g') || conditions.connectionType.includes('slow')) {
      warnings.push('Slow network detected - video quality may be reduced');
      tips.push('Consider using WiFi for better video quality');
    }

    return {
      canUseVideo: true, // Video is always available, just with different quality levels
      recommendedQuality: recommendation.videoQuality,
      warnings,
      tips
    };
  }
}