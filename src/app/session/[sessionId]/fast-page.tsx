/**
 * Fast Session Page
 * Optimized session page using fast initialization
 */

"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useFastSession } from '@/hooks/use-fast-session';
import { EnhancedButton, CircularButton, ButtonGroup } from '@/components/ui/enhanced-button';
import { useEnhancedViewport } from '@/lib/enhanced-viewport';
import { CameraPreview } from '@/components/session/camera-preview';
import { HarthioSessionUI } from '@/components/session/harthio-session-ui';
import { SessionSafetyDisclaimer } from '@/components/session/session-safety-disclaimer';
import { LoadingSpinner } from '@/components/common/loading-states';

export default function FastHarthioSessionPage() {
  const { sessionId } = useParams();
  const { viewport, touchTargetConfig, safeZones, cssProperties } = useEnhancedViewport();
  
  // Fast session initialization with optimizations
  const {
    // Session state
    sessionData,
    isLoading,
    error,
    progress,
    initTime,
    usedFastTrack,
    
    // Flow state
    showSafetyDisclaimer,
    showCameraPreview,
    isReadyToJoin,
    hasJoinedSession,
    sessionState,
    connectionOptimized,
    
    // Auto-join state
    autoJoinCountdown,
    canCancelAutoJoin,
    
    // Camera state
    cameraStream,
    cameraLoading,
    cameraError,
    cameraInitTime,
    cameraUsedCache,
    
    // Media controls
    mediaState,
    controls,
    
    // Actions
    joinSession,
    cancelAutoJoin,
    acceptSafetyDisclaimer,
    declineSafetyDisclaimer,
    backToDashboard,
    retryCamera,
    
    // Managers
    videoManager,
    messagingService
  } = useFastSession({
    sessionId: sessionId as string,
    enableFastTrack: true,
    skipSafetyDisclaimer: false,
    skipCameraPreview: false,
    autoJoin: true,
    autoJoinDelay: 3000
  });

  // Show loading state with progress
  if (isLoading) {
    return (
      <div 
        className="fixed inset-0 w-full h-full flex items-center justify-center bg-black text-white"
        style={cssProperties}
      >
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div className="space-y-2">
            <p className="text-rose-200 text-lg">
              {progress?.message || 'Loading session...'}
            </p>
            {progress && (
              <div className="w-64 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-rose-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            )}
            {initTime > 0 && (
              <p className="text-rose-300/60 text-sm">
                {usedFastTrack ? '⚡ Fast-track mode' : 'Standard mode'} • {initTime}ms
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div 
        className="fixed inset-0 w-full h-full flex items-center justify-center bg-black text-white"
        style={cssProperties}
      >
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white">Session Error</h2>
          <p className="text-gray-300">{error}</p>
          <div className="space-y-3">
            <EnhancedButton
              onClick={() => window.location.reload()}
              className="bg-rose-600 hover:bg-rose-700 text-white"
              touchTarget="medium"
            >
              Try Again
            </EnhancedButton>
            <EnhancedButton
              onClick={backToDashboard}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              touchTarget="medium"
            >
              Back to Dashboard
            </EnhancedButton>
          </div>
        </div>
      </div>
    );
  }

  // Show safety disclaimer
  if (showSafetyDisclaimer) {
    return (
      <>
        <SessionSafetyDisclaimer
          isOpen={showSafetyDisclaimer}
          onAccept={acceptSafetyDisclaimer}
          onDecline={declineSafetyDisclaimer}
          sessionTitle={sessionData?.title}
        />
        {/* Background with initialization info */}
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400/30 mx-auto mb-2"></div>
            <p className="text-rose-200/50 text-sm">
              Session ready in {initTime}ms {usedFastTrack && '⚡'}
            </p>
          </div>
        </div>
      </>
    );
  }

  // Show camera preview with fast auto-join
  if (showCameraPreview && sessionState !== 'connected') {
    return (
      <div 
        className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden"
        style={cssProperties}
      >
        {/* Enhanced Top Navigation with Safe Area */}
        <div 
          className="absolute left-4 z-50"
          style={{ top: `${safeZones.top + 8}px` }}
        >
          <EnhancedButton
            onClick={backToDashboard}
            variant="ghost"
            touchTarget="medium"
            safeArea={true}
            className="text-white hover:bg-white/10"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </EnhancedButton>
        </div>

        <div 
          className="h-full flex flex-col px-4"
          style={{ 
            paddingTop: `${safeZones.top + 60}px`,
            paddingBottom: `${safeZones.bottom + 16}px`
          }}
        >
          {/* Enhanced Camera Preview Section */}
          <div className="flex justify-center mb-4">
            <div 
              className="w-full max-w-sm"
              style={{
                maxWidth: viewport.width < 400 ? '280px' : 
                         viewport.width < 600 ? '320px' : '400px'
              }}
            >
              <CameraPreview 
                onStreamReady={() => {}}
                onError={() => {}}
                onDeviceInfo={() => {}}
                className="w-full"
                connectionOptimized={connectionOptimized}
              />
            </div>
          </div>
          
          {/* Action Section */}
          <div className="flex-1 flex flex-col justify-center px-3 sm:px-4">
            <div className="text-center space-y-4 max-w-sm mx-auto">
              
              {/* Session Info */}
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-white leading-tight">
                  {sessionData?.title || 'Session'}
                </h2>
                <p className="text-gray-400 text-xs leading-tight">
                  ⚡ Fast initialization: {initTime}ms {cameraUsedCache && '(cached)'}
                </p>
              </div>

              {/* Auto-join countdown */}
              {autoJoinCountdown !== null && canCancelAutoJoin && (
                <div className="bg-green-900/30 border border-green-600/30 rounded-lg p-3 mb-4">
                  <div className="text-center">
                    <p className="text-green-400 text-sm font-medium mb-2">
                      🚀 Auto-joining in {autoJoinCountdown}s
                    </p>
                    <EnhancedButton
                      onClick={cancelAutoJoin}
                      variant="outline"
                      touchTarget="compact"
                      className="bg-transparent border-green-600/50 text-green-400 hover:bg-green-900/50 text-xs"
                    >
                      Cancel Auto-join
                    </EnhancedButton>
                  </div>
                </div>
              )}

              {/* Connection status */}
              {!connectionOptimized && isReadyToJoin && (
                <div className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-3 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                      <p className="text-blue-400 text-sm">Optimizing connection...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Action Buttons */}
              {!hasJoinedSession && autoJoinCountdown === null && (
                <ButtonGroup>
                  <EnhancedButton
                    onClick={backToDashboard}
                    variant="outline"
                    touchTarget="auto"
                    safeArea={true}
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    Back
                  </EnhancedButton>
                  
                  <EnhancedButton
                    onClick={joinSession}
                    touchTarget="auto"
                    safeArea={true}
                    haptic={true}
                    className={connectionOptimized 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-rose-600 hover:bg-rose-700 text-white"
                    }
                  >
                    {connectionOptimized ? "Join Session ⚡" : "Join Session"}
                  </EnhancedButton>
                </ButtonGroup>
              )}

              {/* Connection status when joining */}
              {hasJoinedSession && sessionState === 'connecting' && (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-rose-400"></div>
                  <p className="text-gray-300 text-xs">Connecting...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show main session UI when connected
  if (sessionState === 'connected' && videoManager) {
    return (
      <HarthioSessionUI
        localVideoRef={React.createRef()}
        remoteVideoRef={React.createRef()}
        sessionState={sessionState}
        connectionQuality="good"
        connectionStats={{
          bandwidth: 0,
          latency: 0,
          packetLoss: 0,
          quality: 'good',
          resolution: 'unknown',
          frameRate: 0
        }}
        isAudioMuted={mediaState.isAudioMuted}
        isVideoOff={mediaState.isVideoOff}
        isRemoteAudioMuted={false}
        isRemoteVideoOff={false}
        currentUserName="You"
        currentUserId="current-user"
        otherUserName="Other User"
        sessionDuration={0}
        timeRemaining={null}
        sessionId={sessionId as string}
        sessionTitle={sessionData?.title}
        onToggleAudio={controls.toggleAudio}
        onToggleVideo={controls.toggleVideo}
        onEndCall={() => {
          if (videoManager && 'hangup' in videoManager) {
            videoManager.hangup();
          }
          backToDashboard();
        }}
        onReconnect={() => {
          if (videoManager && 'retry' in videoManager) {
            videoManager.retry();
          }
        }}
        onSendMessage={(message: string) => {
          if (messagingService && 'sendMessage' in messagingService) {
            messagingService.sendMessage(message);
          }
        }}
        onSwitchToJitsi={() => {}}
        messages={[]}
        notifications={[]}
        onCopySessionLink={() => {}}
        onOpenSettings={() => {}}
        currentProvider="fast"
        onSwitchProvider={() => {}}
        userStream={cameraStream}
        deviceInfo={null}
        remoteDeviceInfo={null}
        onSendDeviceInfo={() => {}}
      />
    );
  }

  // Fallback loading state
  return (
    <div 
      className="fixed inset-0 w-full h-full flex items-center justify-center bg-black text-white"
      style={cssProperties}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-rose-200 mt-4">Preparing session...</p>
      </div>
    </div>
  );
}