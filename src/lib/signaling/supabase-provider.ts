
import { supabaseClient as supabase } from '../supabase';
import { SignalingProvider, SignalingCallback, SignalingMessage } from './signaling-provider';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class SupabaseSignalingProvider implements SignalingProvider {
    private channel: RealtimeChannel | null = null;
    private callbacks: SignalingCallback[] = [];
    private sessionId: string | null = null;
    private userId: string | null = null;

    async connect(sessionId: string, userId: string): Promise<void> {
        this.sessionId = sessionId;
        this.userId = userId;

        console.log(`[SupabaseSignaling] Connecting to session ${sessionId} as ${userId}`);

        return new Promise((resolve, reject) => {
            this.channel = supabase
                .channel(`p2p-session-${sessionId}`)
                .on('broadcast', { event: 'p2p-signal' }, (payload) => {
                    this.handleIncomingMessage(payload.payload);
                })
                .subscribe((status) => {
                    console.log(`[SupabaseSignaling] Channel status: ${status}`);
                    if (status === 'SUBSCRIBED') {
                        resolve();
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        reject(new Error(`Failed to subscribe to signaling channel: ${status}`));
                    }
                });
        });
    }

    disconnect(): void {
        if (this.channel) {
            console.log('[SupabaseSignaling] Disconnecting...');
            this.channel.unsubscribe();
            this.channel = null;
        }
        this.callbacks = [];
    }

    sendMessage(to: string, type: string, payload: any): void {
        if (!this.channel || !this.userId) {
            console.warn('[SupabaseSignaling] Cannot send message: not connected');
            return;
        }

        const message: SignalingMessage = {
            type,
            from: this.userId,
            to,
            payload,
            timestamp: Date.now()
        };

        console.log(`[SupabaseSignaling] Sending ${type} to ${to}`);

        this.channel.send({
            type: 'broadcast',
            event: 'p2p-signal',
            payload: message
        });
    }

    onMessage(callback: SignalingCallback): void {
        this.callbacks.push(callback);
    }

    isConnected(): boolean {
        return this.channel?.state === 'joined';
    }

    private handleIncomingMessage(message: any): void {
        // Basic validation
        if (!message || !message.type || !message.from) return;

        // Filter out messages sent by ourselves
        if (message.from === this.userId) return;

        // Filter out messages not intended for us (unless broadcast)
        if (message.to !== 'all' && message.to !== this.userId) return;

        // Notify listeners
        this.callbacks.forEach(callback => callback(message));
    }
}
