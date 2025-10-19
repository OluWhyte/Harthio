/**
 * Admin Polling Service
 * Replaces real-time subscriptions for admin dashboard with efficient polling
 * Reduces server load while maintaining admin functionality
 */

import { AdminService } from './services/admin-service';

export interface AdminPollingData {
  sessions: any[];
  users: any[];
  analytics: any;
  lastUpdated: Date;
}

export interface AdminPollingOptions {
  sessionsInterval?: number; // Default: 30s
  usersInterval?: number;    // Default: 60s
  analyticsInterval?: number; // Default: 120s
  onUpdate?: (data: Partial<AdminPollingData>) => void;
  onError?: (error: string) => void;
}

export class AdminPollingService {
  private static instance: AdminPollingService | null = null;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isActive: boolean = false;
  private callbacks: Array<(data: Partial<AdminPollingData>) => void> = [];
  private errorCallbacks: Array<(error: string) => void> = [];
  private lastData: AdminPollingData | null = null;

  static getInstance(): AdminPollingService {
    if (!AdminPollingService.instance) {
      AdminPollingService.instance = new AdminPollingService();
    }
    return AdminPollingService.instance;
  }

  startPolling(options: AdminPollingOptions = {}): void {
    if (this.isActive) {
      console.log('Admin polling already active');
      return;
    }

    console.log('Starting admin polling service');
    this.isActive = true;

    const {
      sessionsInterval = 30000,  // 30 seconds
      usersInterval = 60000,     // 60 seconds  
      analyticsInterval = 120000, // 2 minutes
      onUpdate,
      onError
    } = options;

    if (onUpdate) {
      this.callbacks.push(onUpdate);
    }
    if (onError) {
      this.errorCallbacks.push(onError);
    }

    // Start polling for sessions
    this.startSessionsPolling(sessionsInterval);
    
    // Start polling for users
    this.startUsersPolling(usersInterval);
    
    // Start polling for analytics
    this.startAnalyticsPolling(analyticsInterval);

    // Initial fetch
    this.fetchAllData();
  }

  stopPolling(): void {
    if (!this.isActive) {
      return;
    }

    console.log('Stopping admin polling service');
    this.isActive = false;

    // Clear all intervals
    this.intervals.forEach((interval, key) => {
      clearInterval(interval);
      console.log(`Cleared ${key} polling interval`);
    });
    this.intervals.clear();

    // Clear callbacks
    this.callbacks = [];
    this.errorCallbacks = [];
  }

  private startSessionsPolling(interval: number): void {
    const pollSessions = async () => {
      try {
        const sessions = await AdminService.getAllTopics();
        const updateData = { 
          sessions, 
          lastUpdated: new Date() 
        };
        
        this.updateLastData(updateData);
        this.notifyCallbacks(updateData);
      } catch (error) {
        const errorMessage = `Failed to fetch sessions: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        this.notifyErrorCallbacks(errorMessage);
      }
    };

    // Initial fetch
    pollSessions();
    
    // Set up interval
    const intervalId = setInterval(pollSessions, interval);
    this.intervals.set('sessions', intervalId);
  }

  private startUsersPolling(interval: number): void {
    const pollUsers = async () => {
      try {
        const users = await AdminService.getAllUsers();
        const updateData = { 
          users, 
          lastUpdated: new Date() 
        };
        
        this.updateLastData(updateData);
        this.notifyCallbacks(updateData);
      } catch (error) {
        const errorMessage = `Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        this.notifyErrorCallbacks(errorMessage);
      }
    };

    // Initial fetch
    pollUsers();
    
    // Set up interval
    const intervalId = setInterval(pollUsers, interval);
    this.intervals.set('users', intervalId);
  }

  private startAnalyticsPolling(interval: number): void {
    const pollAnalytics = async () => {
      try {
        const analytics = await AdminService.getUserAnalytics();
        const updateData = { 
          analytics, 
          lastUpdated: new Date() 
        };
        
        this.updateLastData(updateData);
        this.notifyCallbacks(updateData);
      } catch (error) {
        const errorMessage = `Failed to fetch analytics: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        this.notifyErrorCallbacks(errorMessage);
      }
    };

    // Initial fetch
    pollAnalytics();
    
    // Set up interval
    const intervalId = setInterval(pollAnalytics, interval);
    this.intervals.set('analytics', intervalId);
  }

  private async fetchAllData(): Promise<void> {
    try {
      console.log('Fetching initial admin data');
      
      const [sessions, users, analytics] = await Promise.allSettled([
        AdminService.getAllTopics(),
        AdminService.getAllUsers(),
        AdminService.getUserAnalytics()
      ]);

      const updateData: Partial<AdminPollingData> = {
        lastUpdated: new Date()
      };

      if (sessions.status === 'fulfilled') {
        updateData.sessions = sessions.value;
      } else {
        console.error('Failed to fetch sessions:', sessions.reason);
      }

      if (users.status === 'fulfilled') {
        updateData.users = users.value;
      } else {
        console.error('Failed to fetch users:', users.reason);
      }

      if (analytics.status === 'fulfilled') {
        updateData.analytics = analytics.value;
      } else {
        console.error('Failed to fetch analytics:', analytics.reason);
      }

      this.updateLastData(updateData);
      this.notifyCallbacks(updateData);
      
    } catch (error) {
      const errorMessage = `Failed to fetch initial admin data: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      this.notifyErrorCallbacks(errorMessage);
    }
  }

  private updateLastData(updateData: Partial<AdminPollingData>): void {
    if (!this.lastData) {
      this.lastData = {
        sessions: [],
        users: [],
        analytics: null,
        lastUpdated: new Date()
      };
    }

    Object.assign(this.lastData, updateData);
  }

  private notifyCallbacks(data: Partial<AdminPollingData>): void {
    this.callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in admin polling callback:', error);
      }
    });
  }

  private notifyErrorCallbacks(error: string): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in admin polling error callback:', callbackError);
      }
    });
  }

  // Public methods for manual control
  async refreshSessions(): Promise<void> {
    try {
      const sessions = await AdminService.getAllTopics();
      const updateData = { sessions, lastUpdated: new Date() };
      this.updateLastData(updateData);
      this.notifyCallbacks(updateData);
    } catch (error) {
      const errorMessage = `Failed to refresh sessions: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.notifyErrorCallbacks(errorMessage);
    }
  }

  async refreshUsers(): Promise<void> {
    try {
      const users = await AdminService.getAllUsers();
      const updateData = { users, lastUpdated: new Date() };
      this.updateLastData(updateData);
      this.notifyCallbacks(updateData);
    } catch (error) {
      const errorMessage = `Failed to refresh users: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.notifyErrorCallbacks(errorMessage);
    }
  }

  async refreshAnalytics(): Promise<void> {
    try {
      const analytics = await AdminService.getUserAnalytics();
      const updateData = { analytics, lastUpdated: new Date() };
      this.updateLastData(updateData);
      this.notifyCallbacks(updateData);
    } catch (error) {
      const errorMessage = `Failed to refresh analytics: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.notifyErrorCallbacks(errorMessage);
    }
  }

  getLastData(): AdminPollingData | null {
    return this.lastData;
  }

  isPollingActive(): boolean {
    return this.isActive;
  }

  getPollingStatus(): {
    isActive: boolean;
    activeIntervals: string[];
    lastUpdate: Date | null;
  } {
    return {
      isActive: this.isActive,
      activeIntervals: Array.from(this.intervals.keys()),
      lastUpdate: this.lastData?.lastUpdated || null
    };
  }

  // Subscribe to updates
  onUpdate(callback: (data: Partial<AdminPollingData>) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to errors
  onError(callback: (error: string) => void): () => void {
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }
}

// Export singleton instance
export const adminPollingService = AdminPollingService.getInstance();

// React hook for admin components
import React from 'react';

export function useAdminPolling(options: AdminPollingOptions = {}) {
  const [data, setData] = React.useState<AdminPollingData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Start polling
    adminPollingService.startPolling({
      ...options,
      onUpdate: (updateData) => {
        setData(prev => ({ ...prev, ...updateData } as AdminPollingData));
        setIsLoading(false);
        setError(null);
        options.onUpdate?.(updateData);
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        setIsLoading(false);
        options.onError?.(errorMessage);
      }
    });

    // Get initial data if available
    const initialData = adminPollingService.getLastData();
    if (initialData) {
      setData(initialData);
      setIsLoading(false);
    }

    // Cleanup on unmount
    return () => {
      adminPollingService.stopPolling();
    };
  }, []);

  return {
    data,
    error,
    isLoading,
    refresh: {
      sessions: adminPollingService.refreshSessions.bind(adminPollingService),
      users: adminPollingService.refreshUsers.bind(adminPollingService),
      analytics: adminPollingService.refreshAnalytics.bind(adminPollingService)
    },
    status: adminPollingService.getPollingStatus()
  };
}