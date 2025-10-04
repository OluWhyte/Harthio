// ============================================================================
// SIGNALING SERVICE
// ============================================================================
// Handles WebRTC signaling messages via Supabase real-time
// Manages offer/answer/ICE candidate exchange between peers
// ============================================================================

import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface SignalingMessage {
  id?: string;
  session_id: string;
  sender_id: string;
  recipient_id: string;
  type:
    | "offer"
    | "answer"
    | "ice-candidate"
    | "connection-state"
    | "user-joined"
    | "user-left";
  data: any;
  created_at?: string;
}

export type SignalingCallback = (message: SignalingMessage) => void;

export class SignalingService {
  private channel: RealtimeChannel | null = null;
  private sessionId: string;
  private userId: string;

  constructor(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  // Subscribe to signaling messages for this user
  subscribe(callback: SignalingCallback): void {
    console.log(
      `Setting up signaling for session ${this.sessionId}, user ${this.userId}`
    );

    this.channel = supabase
      .channel(`signaling-${this.sessionId}-${this.userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "signaling",
          filter: `recipient_id=eq.${this.userId}`,
        },
        (payload) => {
          console.log("Received signaling message:", payload.new);
          callback(payload.new as SignalingMessage);
        }
      )
      .subscribe((status) => {
        console.log("Signaling subscription status:", status);
      });
  }

  // Send a signaling message
  async sendMessage(
    recipientId: string,
    type: SignalingMessage["type"],
    data: any
  ): Promise<void> {
    try {
      console.log(`Sending ${type} message to ${recipientId}`);

      const message = {
        session_id: this.sessionId,
        sender_id: this.userId,
        recipient_id: recipientId,
        type,
        data,
      };

      const { error } = await supabase.from("signaling").insert(message as any);

      if (error) {
        console.error("Failed to send signaling message:", error);
        throw new Error(`Failed to send ${type} message: ${error.message}`);
      }

      console.log(`${type} message sent successfully`);
    } catch (error) {
      console.error("Error in sendMessage:", error);
      throw error;
    }
  }

  // Send WebRTC offer
  async sendOffer(
    recipientId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    await this.sendMessage(recipientId, "offer", offer);
  }

  // Send WebRTC answer
  async sendAnswer(
    recipientId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    await this.sendMessage(recipientId, "answer", answer);
  }

  // Send ICE candidate
  async sendIceCandidate(
    recipientId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    await this.sendMessage(recipientId, "ice-candidate", candidate);
  }

  // Send connection state update
  async sendConnectionState(recipientId: string, state: string): Promise<void> {
    await this.sendMessage(recipientId, "connection-state", { state });
  }

  // Send user joined notification
  async sendUserJoined(recipientId: string, userName: string): Promise<void> {
    await this.sendMessage(recipientId, "user-joined", {
      userName,
      timestamp: new Date().toISOString(),
    });
  }

  // Send user left notification
  async sendUserLeft(recipientId: string, userName: string): Promise<void> {
    await this.sendMessage(recipientId, "user-left", {
      userName,
      timestamp: new Date().toISOString(),
    });
  }

  // Clean up old signaling messages (optional cleanup)
  async cleanup(): Promise<void> {
    try {
      // Delete messages older than 1 hour for this session
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from("signaling")
        .delete()
        .eq("session_id", this.sessionId)
        .lt("created_at", oneHourAgo);

      if (error) {
        console.warn("Failed to cleanup old signaling messages:", error);
      } else {
        console.log("Cleaned up old signaling messages");
      }
    } catch (error) {
      console.warn("Error during signaling cleanup:", error);
    }
  }

  // Unsubscribe from signaling
  unsubscribe(): void {
    if (this.channel) {
      console.log("Unsubscribing from signaling channel");
      this.channel.unsubscribe();
      this.channel = null;
    }
  }

  // Get the current subscription status
  getStatus(): string {
    return this.channel?.state || "disconnected";
  }
}
