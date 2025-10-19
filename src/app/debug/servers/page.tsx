/**
 * Server Status Debug Page
 * Check TURN/STUN and Jitsi server connectivity
 */

"use client";

import { ServerStatusChecker } from '@/components/debug/server-status-checker';

export default function ServerDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <ServerStatusChecker />
      </div>
    </div>
  );
}