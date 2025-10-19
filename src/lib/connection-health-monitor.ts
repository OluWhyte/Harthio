/**
 * Connection Health Monitor
 * Monitors real-time connection health and provides graceful degradation
 */

import { realtimeManager } from './realtime-manager';

export interface ConnectionHealth {
  isHealthy: boolean;
  healthyChannels: number;
  unhealthyChannels: number;
  lastCheck: Date;
  degradationLevel: 'none' | 'partial' | 'full';
  recommendations: string[];
}

export class ConnectionHealthMonitor {
  private static instance: ConnectionHealthMonitor | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private callbacks: Array<(health: ConnectionHealth) => void> = [];
  private lastHealth: ConnectionHealth | null = null;
  private checkIntervalMs: number = 60000; // Check every 60 seconds - less frequent

  static getInstance(): ConnectionHealthMonitor {
    if (!ConnectionHealthMonitor.instance) {
      ConnectionHealthMonitor.instance = new ConnectionHealthMonitor();
    }
    return ConnectionHealthMonitor.instance;
  }

  startMonitoring(): void {
    // Disabled for production - only enable for debug purposes
    console.log('Connection health monitoring disabled for production use');
    return;
    
    if (this.healthCheckInterval) {
      return; // Already monitoring
    }

    console.log('Starting connection health monitoring');
    
    // Initial check
    this.performHealthCheck();
    
    // Set up periodic checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.checkIntervalMs);
  }

  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('Stopped connection health monitoring');
    }
  }

  private performHealthCheck(): void {
    const healthInfo = realtimeManager.monitorSubscriptionHealth();
    const totalChannels = healthInfo.healthy + healthInfo.unhealthy;
    
    let degradationLevel: 'none' | 'partial' | 'full' = 'none';
    const recommendations: string[] = [];
    
    // Determine degradation level - More lenient for optimized setup
    if (totalChannels === 0) {
      degradationLevel = 'full';
      // No user-facing messages - keep technical issues silent
    } else if (healthInfo.unhealthy > 0) {
      const unhealthyRatio = healthInfo.unhealthy / totalChannels;
      // Only mark as full degradation if ALL connections are failing
      if (unhealthyRatio >= 1.0) {
        degradationLevel = 'full';
        // No user-facing messages - keep technical issues silent
      } else if (unhealthyRatio > 0.7) {
        degradationLevel = 'partial';
        // No user-facing messages - keep technical issues silent
      }
      // Don't show warnings for minor issues - optimized debouncing is expected
    }

    // Add specific recommendations based on failed channels
    healthInfo.details.forEach(detail => {
      if (!detail.isHealthy) {
        // Remove all user-facing messages - technical issues should be silent
      }
    });

    const health: ConnectionHealth = {
      isHealthy: healthInfo.unhealthy === 0 && totalChannels > 0,
      healthyChannels: healthInfo.healthy,
      unhealthyChannels: healthInfo.unhealthy,
      lastCheck: new Date(),
      degradationLevel,
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };

    // Only notify if health status changed significantly
    if (this.shouldNotifyHealthChange(health)) {
      this.lastHealth = health;
      this.notifyCallbacks(health);
    }
  }

  private shouldNotifyHealthChange(newHealth: ConnectionHealth): boolean {
    if (!this.lastHealth) {
      return true; // First check
    }

    // Notify if degradation level changed
    if (this.lastHealth.degradationLevel !== newHealth.degradationLevel) {
      return true;
    }

    // Notify if health status changed
    if (this.lastHealth.isHealthy !== newHealth.isHealthy) {
      return true;
    }

    // Notify if number of unhealthy channels changed significantly
    const unhealthyDiff = Math.abs(this.lastHealth.unhealthyChannels - newHealth.unhealthyChannels);
    if (unhealthyDiff > 0) {
      return true;
    }

    return false;
  }

  private notifyCallbacks(health: ConnectionHealth): void {
    this.callbacks.forEach(callback => {
      try {
        callback(health);
      } catch (error) {
        console.error('Error in health monitor callback:', error);
      }
    });
  }

  onHealthChange(callback: (health: ConnectionHealth) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  getCurrentHealth(): ConnectionHealth | null {
    return this.lastHealth;
  }

  // Force a health check (useful for debugging)
  forceHealthCheck(): ConnectionHealth {
    this.performHealthCheck();
    return this.lastHealth!;
  }

  // Get detailed connection info for debugging
  getDetailedInfo(): {
    subscriptionInfo: any;
    retryInfo: any;
    connectionStatus: any;
  } {
    return {
      subscriptionInfo: realtimeManager.getSubscriptionInfo(),
      retryInfo: realtimeManager.getRetryInfo(),
      connectionStatus: realtimeManager.getConnectionStatus()
    };
  }
}

// Export singleton instance
export const connectionHealthMonitor = ConnectionHealthMonitor.getInstance();

// Hook for React components
export function useConnectionHealth() {
  const [health, setHealth] = React.useState<ConnectionHealth | null>(null);
  
  React.useEffect(() => {
    // Start monitoring when first component mounts
    connectionHealthMonitor.startMonitoring();
    
    // Subscribe to health changes
    const unsubscribe = connectionHealthMonitor.onHealthChange(setHealth);
    
    // Get initial health
    const currentHealth = connectionHealthMonitor.getCurrentHealth();
    if (currentHealth) {
      setHealth(currentHealth);
    }
    
    return unsubscribe;
  }, []);
  
  return health;
}

// React import for the hook
import React from 'react';