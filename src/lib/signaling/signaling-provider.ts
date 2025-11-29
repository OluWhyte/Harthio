
export interface SignalingMessage {
  type: string;
  from: string;
  to: string;
  payload: any;
  timestamp: number;
}

export interface SignalingCallback {
  (message: SignalingMessage): void;
}

export interface SignalingProvider {
  /**
   * Connect to the signaling service
   */
  connect(sessionId: string, userId: string): Promise<void>;

  /**
   * Disconnect from the signaling service
   */
  disconnect(): void;

  /**
   * Send a message to a specific peer or broadcast to all
   * @param to Target user ID or 'all'
   * @param type Message type (e.g., 'offer', 'answer', 'ice-candidate')
   * @param payload The data to send
   */
  sendMessage(to: string, type: string, payload: any): void;

  /**
   * Subscribe to incoming messages
   */
  onMessage(callback: SignalingCallback): void;

  /**
   * Check if currently connected
   */
  isConnected(): boolean;
}
