# Harthio Component Documentation 2025

## Overview

This document provides detailed documentation for all new and enhanced components in the 2025 platform update.

## 🎨 Session Components

### ModernChatPanel (`src/components/harthio/modern-chat-panel.tsx`)

Modern, responsive chat interface for active sessions.

#### Props
```typescript
interface ModernChatPanelProps {
  sessionId: string;
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
  position?: 'left' | 'right' | 'bottom';
  theme?: 'light' | 'dark' | 'auto';
}
```

#### Features
- **Real-time messaging** with instant delivery
- **Typing indicators** showing when others are typing
- **Message status** (sent, delivered, read)
- **Emoji support** with picker integration
- **File attachments** (images, documents)
- **Message search** and filtering
- **Mobile-optimized** touch interactions
- **Accessibility** WCAG 2.1 compliant

#### Usage
```tsx
<ModernChatPanel
  sessionId="session-123"
  isVisible={chatOpen}
  onToggle={() => setChatOpen(!chatOpen)}
  position="right"
  theme="auto"
/>
```

### SessionContainer (`src/components/harthio/session-container.tsx`)

Wrapper component that manages session state and provides context.

#### Props
```typescript
interface SessionContainerProps {
  sessionId: string;
  children: React.ReactNode;
  onSessionEnd?: () => void;
  onError?: (error: Error) => void;
}
```

#### Context Provided
```typescript
interface SessionContext {
  session: Session | null;
  isActive: boolean;
  participants: Participant[];
  messages: Message[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  sendMessage: (text: string) => Promise<void>;
  leaveSession: () => Promise<void>;
}
```

### SessionWithChat (`src/components/harthio/session-with-chat.tsx`)

Integrated session view with embedded chat functionality.

#### Props
```typescript
interface SessionWithChatProps {
  sessionId: string;
  layout?: 'sidebar' | 'overlay' | 'split';
  chatPosition?: 'left' | 'right' | 'bottom';
  showParticipants?: boolean;
  enableScreenShare?: boolean;
}
```

#### Layouts
- **Sidebar**: Chat panel on side of video
- **Overlay**: Chat overlays video when active
- **Split**: Video and chat split screen

### EnhancedMessagingPanel (`src/components/session/enhanced-messaging-panel.tsx`)

Advanced messaging panel with rich features.

#### Props
```typescript
interface EnhancedMessagingPanelProps {
  topicId: string;
  currentUserId: string;
  isSessionActive: boolean;
  onMessageSent?: (message: Message) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  maxMessages?: number;
  enableFileUpload?: boolean;
  enableEmojis?: boolean;
}
```

#### Advanced Features
- **Rich text formatting** (bold, italic, links)
- **File drag & drop** upload
- **Message reactions** with emoji
- **Reply to messages** threading
- **Message editing** and deletion
- **Export conversation** to PDF/text
- **Message search** with filters
- **Keyboard shortcuts** for power users

### FloatingChatButton (`src/components/session/floating-chat-button.tsx`)

Floating action button for quick chat access.

#### Props
```typescript
interface FloatingChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'accent';
}
```

#### Features
- **Unread message badge** with count
- **Smooth animations** and transitions
- **Customizable positioning** and styling
- **Accessibility** keyboard navigation
- **Mobile-optimized** touch targets

### SessionSettingsModal (`src/components/session/session-settings-modal.tsx`)

Comprehensive session configuration modal.

#### Props
```typescript
interface SessionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  userRole: 'author' | 'participant';
  settings: SessionSettings;
  onSettingsChange: (settings: SessionSettings) => void;
}
```

#### Settings Categories
- **Audio/Video Quality**: Resolution, bitrate, codec preferences
- **Notifications**: Sound alerts, desktop notifications
- **Privacy**: Recording permissions, data sharing
- **Accessibility**: Captions, high contrast, keyboard navigation
- **Advanced**: Network settings, debug options

### ZoomChatPanel (`src/components/session/zoom-chat-panel.tsx`)

Zoom-style chat panel with familiar UX patterns.

#### Props
```typescript
interface ZoomChatPanelProps {
  sessionId: string;
  isMinimized?: boolean;
  onMinimize?: () => void;
  showParticipantList?: boolean;
  enablePrivateMessages?: boolean;
}
```

#### Features
- **Participant list** with status indicators
- **Private messaging** between participants
- **Chat history** persistence
- **Message notifications** with sound
- **Keyboard shortcuts** (Ctrl+Enter to send)

## 🔧 Admin Components

### AdminAnalytics (`src/components/admin/admin-analytics.tsx`)

Comprehensive analytics dashboard for administrators.

#### Props
```typescript
interface AdminAnalyticsProps {
  timeRange?: 'day' | 'week' | 'month' | 'year';
  refreshInterval?: number;
  showRealTime?: boolean;
}
```

#### Analytics Sections
- **User Engagement**: Active users, session participation
- **Session Metrics**: Completion rates, duration analytics
- **Performance**: Load times, error rates, uptime
- **Geographic**: User locations, regional usage patterns
- **Device Analytics**: Browser, OS, device type breakdown
- **Revenue**: Subscription metrics, conversion rates

#### Charts and Visualizations
- **Line charts** for trends over time
- **Bar charts** for comparisons
- **Pie charts** for distributions
- **Heat maps** for geographic data
- **Real-time counters** for live metrics

### ServerStatusChecker (`src/components/debug/server-status-checker.tsx`)

Real-time server monitoring and diagnostics.

#### Props
```typescript
interface ServerStatusCheckerProps {
  servers?: string[];
  checkInterval?: number;
  showDetails?: boolean;
  onStatusChange?: (status: ServerStatus) => void;
}
```

#### Monitored Services
- **Database**: Connection status, query performance
- **WebRTC**: TURN/STUN server availability
- **Real-time**: WebSocket connection health
- **CDN**: Asset delivery performance
- **API**: Endpoint response times

#### Status Indicators
- **Green**: All systems operational
- **Yellow**: Minor issues detected
- **Red**: Critical problems requiring attention
- **Gray**: Service unavailable or unknown

## 🎯 SEO Components

### Analytics (`src/components/seo/analytics.tsx`)

Google Analytics and tracking integration.

#### Props
```typescript
interface AnalyticsProps {
  trackingId: string;
  enableGTM?: boolean;
  customEvents?: CustomEvent[];
  debugMode?: boolean;
}
```

#### Tracked Events
- **Page views** with metadata
- **Session starts/ends**
- **User interactions** (clicks, scrolls)
- **Conversion events** (signups, subscriptions)
- **Performance metrics** (load times, errors)

### StructuredData (`src/components/seo/structured-data.tsx`)

Schema.org structured data generation.

#### Props
```typescript
interface StructuredDataProps {
  type: 'Organization' | 'WebApplication' | 'Event' | 'Person';
  data: any;
  validate?: boolean;
}
```

#### Schema Types
- **Organization**: Company information
- **WebApplication**: App metadata
- **Event**: Session/meeting data
- **Person**: User profile data
- **Review**: User ratings and feedback

## 🔍 Debug Components

### ServerStatusDashboard (`src/app/debug/servers/page.tsx`)

Comprehensive server monitoring dashboard.

#### Features
- **Real-time status** of all services
- **Historical uptime** charts
- **Performance metrics** graphs
- **Error logs** with filtering
- **Alert configuration** and notifications

#### Monitored Metrics
- **Response times** for all endpoints
- **Error rates** by service
- **Database query performance**
- **WebRTC connection success rates**
- **Memory and CPU usage**

### MessagePanelDemo (`src/app/demo/message-panel/page.tsx`)

Interactive demo for testing message panel functionality.

#### Features
- **Live message simulation**
- **Different user personas**
- **Various message types** (text, files, emojis)
- **Error condition testing**
- **Performance benchmarking**

## 🎨 UI Enhancement Components

### ResponsiveLayout (`src/components/common/responsive-layout.tsx`)

Adaptive layout component for different screen sizes.

#### Props
```typescript
interface ResponsiveLayoutProps {
  children: React.ReactNode;
  breakpoints?: Breakpoints;
  className?: string;
}
```

#### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Large**: > 1440px

### LoadingStates (`src/components/common/loading-states.tsx`)

Consistent loading indicators across the platform.

#### Components
- **LoadingSpinner**: Animated spinner with customizable size
- **SkeletonLoader**: Content placeholder during loading
- **ProgressBar**: Determinate progress indicator
- **PulseLoader**: Subtle pulsing animation

### ErrorBoundary (`src/components/common/error-boundary.tsx`)

Enhanced error boundary with recovery options.

#### Props
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRecovery?: boolean;
}
```

#### Features
- **Graceful error handling** with user-friendly messages
- **Error reporting** to monitoring services
- **Recovery mechanisms** (retry, refresh, reset)
- **Development mode** detailed error display

## 🔧 Utility Components

### PerformanceMonitor (`src/components/common/performance-monitor.tsx`)

Real-time performance monitoring overlay.

#### Props
```typescript
interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  metrics?: PerformanceMetric[];
}
```

#### Monitored Metrics
- **FPS**: Frames per second
- **Memory**: JavaScript heap usage
- **Network**: Request/response times
- **Render**: Component render times

### AccessibilityHelper (`src/components/common/accessibility-helper.tsx`)

Accessibility enhancement utilities.

#### Features
- **Screen reader** announcements
- **Keyboard navigation** helpers
- **Focus management** utilities
- **High contrast** mode support
- **Text scaling** compatibility

## 📱 Mobile-Specific Components

### MobileOptimizedChat (`src/components/mobile/mobile-optimized-chat.tsx`)

Chat interface optimized for mobile devices.

#### Features
- **Touch-friendly** interface elements
- **Swipe gestures** for navigation
- **Virtual keyboard** handling
- **Orientation change** adaptation
- **Battery optimization** features

### TouchGestures (`src/components/mobile/touch-gestures.tsx`)

Touch gesture recognition and handling.

#### Supported Gestures
- **Tap**: Single touch activation
- **Double tap**: Quick actions
- **Long press**: Context menus
- **Swipe**: Navigation and dismissal
- **Pinch**: Zoom and scale
- **Pan**: Drag and move

## 🎯 Integration Components

### WebRTCProvider (`src/components/providers/webrtc-provider.tsx`)

WebRTC context provider with enhanced capabilities.

#### Context
```typescript
interface WebRTCContext {
  localStream: MediaStream | null;
  remoteStreams: MediaStream[];
  connectionState: RTCPeerConnectionState;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  shareScreen: () => Promise<void>;
  endCall: () => void;
}
```

### RealtimeProvider (`src/components/providers/realtime-provider.tsx`)

Real-time updates context provider.

#### Context
```typescript
interface RealtimeContext {
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  subscribe: (channel: string, callback: RealtimeCallback) => string;
  unsubscribe: (subscriptionId: string) => void;
  publish: (channel: string, data: any) => void;
}
```

## 🔐 Security Components

### SecureInput (`src/components/security/secure-input.tsx`)

Enhanced input component with security features.

#### Props
```typescript
interface SecureInputProps {
  type: 'text' | 'email' | 'password' | 'url';
  validation?: ValidationRule[];
  sanitization?: SanitizationRule[];
  onSecurityEvent?: (event: SecurityEvent) => void;
}
```

#### Security Features
- **Input sanitization** to prevent XSS
- **Pattern validation** for data integrity
- **Rate limiting** for brute force protection
- **Suspicious activity** detection

### ThreatDetector (`src/components/security/threat-detector.tsx`)

Real-time threat detection and monitoring.

#### Features
- **Behavioral analysis** of user actions
- **Anomaly detection** in usage patterns
- **Automated blocking** of suspicious activity
- **Security event logging** and reporting

---

*Last Updated: October 2025*
*Component Library Version: 2.0.0*