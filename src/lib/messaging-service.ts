/**
 * Independent Messaging Service
 * Handles messaging functionality separate from video connections
 * Works with Supabase real-time for reliable message delivery
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from './database-types';

// Safe Supabase client initialization
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(url, key);
};

let supabase: ReturnType<typeof createClient<Database>> | null = null;

export interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
  sessionId: string;
}

export interface MessageCallback {
  onMessage: (message: Message) => void;
  onUserTyping?: (userId: string, isTyping: boolean) => void;
  onError?: (error: string) => void;
}

export class MessagingService {
  private sessionId: string;
  private userId: string;
  private userName: string;
  private callbacks: MessageCallback;
  private channel: any;
  private isConnected: boolean = false;
  private messageQueue: Message[] = [];
  private retryAttempts: number = 0;
  private maxRetries: number = 2; // Reduced from 3 to 2 for faster fallback
  private messageHistory: Message[] = [];

  constructor(
    sessionId: string,
    userId: string,
    userName: string,
    callbacks: MessageCallback
  ) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.userName = userName;
    this.callbacks = callbacks;
    
    // Load message history from localStorage
    this.loadMessageHistory();
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize Supabase client if not already done
      if (!supabase) {
        supabase = getSupabaseClient();
      }
      
      // Create a dedicated channel for messaging
      this.channel = supabase.channel(`session-messages-${this.sessionId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: this.userId }
        }
      });

      // Listen for messages
      this.channel
        .on('broadcast', { event: 'message' }, (payload: any) => {
          this.handleIncomingMessage(payload);
        })
        .on('broadcast', { event: 'typing' }, (payload: any) => {
          this.handleTypingIndicator(payload);
        })
        .on('presence', { event: 'sync' }, () => {
          // Presence synced
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
          // User joined messaging
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
          // User left messaging
        });

      // Subscribe to the channel
      const status = await this.channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          this.retryAttempts = 0;
          
          // Send any queued messages
          await this.flushMessageQueue();
          
          // Track presence
          await this.channel.track({
            userId: this.userId,
            userName: this.userName,
            online_at: new Date().toISOString()
          });
        } else if (status === 'CHANNEL_ERROR') {
          this.isConnected = false;
          this.handleConnectionError();
        } else if (status === 'TIMED_OUT') {
          this.isConnected = false;
          this.handleConnectionError();
        }
      });

    } catch (error) {
      this.callbacks.onError?.('Failed to connect to messaging service');
      this.handleConnectionError();
    }
  }

  private handleIncomingMessage(payload: any): void {
    try {
      const messageData = payload.payload;
      
      // Process all messages, including our own for consistency
      const message: Message = {
        id: messageData.id,
        userId: messageData.userId,
        userName: messageData.userName,
        content: messageData.content,
        timestamp: new Date(messageData.timestamp),
        type: messageData.type || 'text',
        sessionId: this.sessionId
      };

      // Add to history for persistence
      this.addToHistory(message);

      // Only show incoming messages from others (our own are already shown locally)
      if (messageData.userId !== this.userId) {
        this.callbacks.onMessage(message);
      }
    } catch (error) {
      // Error handling incoming message
    }
  }

  private handleTypingIndicator(payload: any): void {
    try {
      const { userId, isTyping } = payload.payload;
      
      // Don't show typing indicator for our own typing
      if (userId !== this.userId) {
        this.callbacks.onUserTyping?.(userId, isTyping);
      }
    } catch (error) {
      // Error handling typing indicator
    }
  }

  private async handleConnectionError(): Promise<void> {
    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      const delay = Math.min(Math.pow(2, this.retryAttempts) * 1000, 5000); // Cap at 5 seconds
      
      setTimeout(() => {
        this.initialize();
      }, delay);
    } else {
      this.callbacks.onError?.('Chat connection unstable. Messages will be queued and sent when connection improves.');
    }
  }

  private async flushMessageQueue(): Promise<void> {
    if (this.messageQueue.length > 0) {
      for (const message of this.messageQueue) {
        await this.sendMessageToChannel(message);
      }
      
      this.messageQueue = [];
    }
  }

  private async sendMessageToChannel(message: Message): Promise<void> {
    if (!this.channel) {
      throw new Error('Messaging channel not initialized');
    }

    await this.channel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        id: message.id,
        userId: message.userId,
        userName: message.userName,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        type: message.type,
        sessionId: message.sessionId
      }
    });
  }

  async sendMessage(content: string, type: 'text' | 'system' = 'text'): Promise<void> {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      userName: this.userName,
      content: content.trim(),
      timestamp: new Date(),
      type,
      sessionId: this.sessionId
    };

    // Add to history for persistence
    this.addToHistory(message);

    // Show message locally immediately for better UX
    this.callbacks.onMessage(message);

    try {
      if (this.isConnected) {
        await this.sendMessageToChannel(message);
      } else {
        // Queue message if not connected
        this.messageQueue.push(message);
        this.callbacks.onError?.('Connection lost. Message will be sent when reconnected.');
      }
    } catch (error) {
      
      // Queue message for retry
      if (!this.messageQueue.find(m => m.id === message.id)) {
        this.messageQueue.push(message);
      }
      
      this.callbacks.onError?.('Failed to send message. It will be sent when connection is restored.');
    }
  }

  async sendTypingIndicator(isTyping: boolean): Promise<void> {
    if (!this.isConnected || !this.channel) {
      return;
    }

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: this.userId,
          userName: this.userName,
          isTyping
        }
      });
    } catch (error) {
      // Failed to send typing indicator
    }
  }

  async sendSystemMessage(content: string): Promise<void> {
    await this.sendMessage(content, 'system');
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.untrack();
        await this.channel.unsubscribe();
        this.channel = null;
      }
      
      this.isConnected = false;
      this.messageQueue = [];
      this.retryAttempts = 0;
    } catch (error) {
      // Error cleaning up messaging service
    }
  }

  // Utility methods for message management
  async clearMessages(): Promise<void> {
    // This would typically clear messages from a database
    // For now, we'll just emit a system message
    await this.sendSystemMessage('Messages cleared');
  }

  async exportMessages(): Promise<Message[]> {
    // Return current message history
    // In a full implementation, this would fetch from database
    return [];
  }

  // Connection health check
  async ping(): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      return false;
    }

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'ping',
        payload: { timestamp: Date.now() }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Message persistence methods
  private getStorageKey(): string {
    return `harthio-messages-${this.sessionId}`;
  }

  private loadMessageHistory(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        this.messageHistory = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        // Replay messages to UI
        this.messageHistory.forEach(msg => {
          this.callbacks.onMessage(msg);
        });
      }
    } catch (error) {
      // Failed to load message history
    }
  }

  private saveMessageHistory(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Keep only last 100 messages to prevent storage bloat
      const messagesToSave = this.messageHistory.slice(-100);
      localStorage.setItem(this.getStorageKey(), JSON.stringify(messagesToSave));
    } catch (error) {
      // Failed to save message history
    }
  }

  private addToHistory(message: Message): void {
    // Avoid duplicates
    if (!this.messageHistory.find(m => m.id === message.id)) {
      this.messageHistory.push(message);
      this.saveMessageHistory();
    }
  }

  clearMessageHistory(): void {
    this.messageHistory = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.getStorageKey());
    }
  }
}

// Utility function to create messaging service
export function createMessagingService(
  sessionId: string,
  userId: string,
  userName: string,
  callbacks: MessageCallback
): MessagingService {
  return new MessagingService(sessionId, userId, userName, callbacks);
}

// Message validation utilities
export function validateMessage(content: string): { isValid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 500) {
    return { isValid: false, error: 'Message too long (max 500 characters)' };
  }
  
  // Check for potentially harmful content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return { isValid: false, error: 'Message contains invalid content' };
    }
  }
  
  return { isValid: true };
}

// Message formatting utilities
export function formatMessageContent(content: string): string {
  // Basic text formatting (could be extended with markdown support)
  return content
    .trim()
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
    .replace(/\s{2,}/g, ' '); // Limit consecutive spaces
}