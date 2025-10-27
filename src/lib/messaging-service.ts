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
    
    // Load message history from storage (async)
    this.loadMessageHistory().then(() => {
      console.log('💬 Message history loaded, initializing real-time connection...');
    });
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize Supabase client if not already done
      if (!supabase) {
        console.log('💬 Initializing Supabase client for messaging...');
        supabase = getSupabaseClient();
        console.log('💬 Supabase client initialized successfully');
      }
      
      // Create a dedicated channel for messaging
      console.log('💬 Creating Supabase channel with config...');
      this.channel = supabase.channel(`session-messages-${this.sessionId}`, {
        config: {
          broadcast: { 
            self: true,
            ack: false // Don't wait for acknowledgments for faster delivery
          },
          presence: { 
            key: this.userId 
          }
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
      console.log('💬 Subscribing to Supabase channel:', `session-messages-${this.sessionId}`);
      const status = await this.channel.subscribe(async (status: string) => {
        console.log('💬 Channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          this.retryAttempts = 0;
          console.log('💬 Successfully connected to messaging channel');
          
          // Send any queued messages
          await this.flushMessageQueue();
          
          // Track presence
          await this.channel.track({
            userId: this.userId,
            userName: this.userName,
            online_at: new Date().toISOString()
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('💬 Channel error occurred');
          this.isConnected = false;
          this.handleConnectionError();
        } else if (status === 'TIMED_OUT') {
          console.error('💬 Channel subscription timed out');
          this.isConnected = false;
          this.handleConnectionError();
        }
      });

    } catch (error) {
      console.error('💬 Failed to initialize messaging service:', error);
      this.callbacks.onError?.('Failed to connect to messaging service');
      this.handleConnectionError();
    }
  }

  private handleIncomingMessage(payload: any): void {
    try {
      console.log('💬 Received message from channel:', payload);
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
        console.log('💬 Showing incoming message from other user:', message.content);
        this.callbacks.onMessage(message);
      } else {
        console.log('💬 Ignoring own message echo:', message.content);
      }
    } catch (error) {
      console.error('💬 Error handling incoming message:', error);
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
    console.warn(`💬 Connection error, retry attempt ${this.retryAttempts + 1}/${this.maxRetries}`);
    
    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      const delay = Math.min(Math.pow(2, this.retryAttempts) * 1000, 5000); // Cap at 5 seconds
      
      console.log(`💬 Retrying connection in ${delay}ms...`);
      setTimeout(() => {
        this.initialize();
      }, delay);
    } else {
      console.error('💬 Max retry attempts reached, giving up');
      this.callbacks.onError?.('Chat connection failed. Messages will be queued and sent when connection improves.');
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

    console.log('💬 Sending message:', { 
      content: message.content, 
      isConnected: this.isConnected,
      userId: this.userId,
      userName: this.userName
    });

    // Add to history for persistence
    this.addToHistory(message);

    // Show message locally immediately for better UX
    this.callbacks.onMessage(message);

    try {
      if (this.isConnected) {
        console.log('💬 Sending to channel...');
        await this.sendMessageToChannel(message);
        console.log('💬 Message sent successfully');
      } else {
        console.warn('💬 Not connected, queueing message');
        // Queue message if not connected
        this.messageQueue.push(message);
        this.callbacks.onError?.('Connection lost. Message will be sent when reconnected.');
      }
    } catch (error) {
      console.error('💬 Error sending message:', error);
      
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

  async cleanup(deleteMessages: boolean = false): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.untrack();
        await this.channel.unsubscribe();
        this.channel = null;
      }
      
      this.isConnected = false;
      this.messageQueue = [];
      this.retryAttempts = 0;
      
      // Only delete messages if explicitly requested (when session is deleted from DB)
      if (deleteMessages) {
        console.log('💬 Session deleted - clearing message history');
        this.clearMessageHistory();
      } else {
        console.log('💬 Session ended - preserving message history');
        // Just save current state
        this.saveMessageHistory();
      }
    } catch (error) {
      console.error('💬 Error cleaning up messaging service:', error);
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

  private async loadMessageHistory(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      // Try IndexedDB first for better persistence
      let messages = await this.loadFromIndexedDB();
      
      // Fallback to localStorage if IndexedDB is empty
      if (messages.length === 0) {
        const stored = localStorage.getItem(this.getStorageKey());
        if (stored) {
          const parsed = JSON.parse(stored);
          messages = parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        }
      }
      
      if (messages.length > 0) {
        this.messageHistory = messages;
        console.log(`💬 Loaded ${messages.length} messages from history for session ${this.sessionId}`);
        
        // Replay messages to UI
        this.messageHistory.forEach(msg => {
          this.callbacks.onMessage(msg);
        });
      }
    } catch (error) {
      console.warn('💬 Failed to load message history:', error);
    }
  }

  private saveMessageHistory(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Keep last 500 messages per session (increased from 100)
      const messagesToSave = this.messageHistory.slice(-500);
      localStorage.setItem(this.getStorageKey(), JSON.stringify(messagesToSave));
      
      // Also save to IndexedDB for better persistence (fallback to localStorage)
      this.saveToIndexedDB(messagesToSave);
    } catch (error) {
      console.warn('💬 Failed to save message history to localStorage:', error);
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
      this.clearFromIndexedDB();
    }
  }

  // IndexedDB methods for better persistence
  private async saveToIndexedDB(messages: Message[]): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const request = indexedDB.open('HarthioMessages', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('messages')) {
          const store = db.createObjectStore('messages', { keyPath: 'sessionId' });
          store.createIndex('sessionId', 'sessionId', { unique: true });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Check if the object store exists before creating transaction
        if (!db.objectStoreNames.contains('messages')) {
          console.warn('💬 Messages object store not found, skipping save');
          return;
        }
        
        const transaction = db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        
        store.put({
          sessionId: this.sessionId,
          messages: messages,
          lastUpdated: new Date().toISOString()
        });
      };
      
      request.onerror = () => {
        console.warn('💬 Failed to open IndexedDB for saving');
      };
    } catch (error) {
      console.warn('💬 IndexedDB save failed:', error);
    }
  }

  private async loadFromIndexedDB(): Promise<Message[]> {
    if (typeof window === 'undefined') return [];
    
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('HarthioMessages', 1);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('messages')) {
            const store = db.createObjectStore('messages', { keyPath: 'sessionId' });
            store.createIndex('sessionId', 'sessionId', { unique: true });
          }
        };
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Check if the object store exists before creating transaction
          if (!db.objectStoreNames.contains('messages')) {
            resolve([]);
            return;
          }
          
          const transaction = db.transaction(['messages'], 'readonly');
          const store = transaction.objectStore('messages');
          const getRequest = store.get(this.sessionId);
          
          getRequest.onsuccess = () => {
            if (getRequest.result && getRequest.result.messages) {
              const messages = getRequest.result.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }));
              resolve(messages);
            } else {
              resolve([]);
            }
          };
          
          getRequest.onerror = () => resolve([]);
        };
        
        request.onerror = () => resolve([]);
      } catch (error) {
        console.warn('💬 IndexedDB not available:', error);
        resolve([]);
      }
    });
  }

  private async clearFromIndexedDB(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const request = indexedDB.open('HarthioMessages', 1);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Check if the object store exists before creating transaction
        if (!db.objectStoreNames.contains('messages')) {
          return;
        }
        
        const transaction = db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        store.delete(this.sessionId);
      };
    } catch (error) {
      console.warn('💬 Failed to clear from IndexedDB:', error);
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