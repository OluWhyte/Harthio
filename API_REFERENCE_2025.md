# Harthio API Reference 2025

## Overview

This document provides comprehensive API reference for all new functions, services, and components added in the 2025 platform enhancements.

## 🔧 Core Services

### Topic Service (`src/lib/supabase-services.ts`)

#### `getAllTopics(): Promise<TopicWithAuthor[]>`
Retrieves all topics with author information and timeout protection.

**Features:**
- 30-second timeout with mobile optimization
- Automatic retry on timeout
- Error logging and handling
- Returns empty array on timeout to prevent UI breakage

**Usage:**
```typescript
const topics = await topicService.getAllTopics();
```

#### `addJoinRequest(topicId: string, requesterId: string, message?: string): Promise<ApiResponse<void>>`
Adds a join request to a topic with comprehensive validation.

**Features:**
- Schedule conflict detection
- Enhanced input validation
- Real-time update broadcasting
- Email notification integration
- Business rule validation

**Parameters:**
- `topicId`: UUID of the target topic
- `requesterId`: UUID of the requesting user
- `message`: Optional request message (max 200 chars)

**Returns:**
```typescript
{
  data: null,
  error: string | null,
  success: boolean
}
```

#### `approveJoinRequest(topicId: string, requesterId: string): Promise<ApiResponse<void>>`
Approves a join request with conflict checking and notifications.

**Features:**
- Schedule conflict validation
- Automatic request cleanup (only 1 participant allowed)
- Real-time broadcasting
- Email notifications to all parties
- State transition to STATE 2

#### `rejectJoinRequest(topicId: string, requesterId: string): Promise<ApiResponse<void>>`
Rejects a specific join request with notifications.

**Features:**
- Request validation and removal
- Real-time updates
- Email notification to rejected user
- Maintains other pending requests

### Real-time Manager (`src/lib/realtime-manager.ts`)

#### `subscribeToTopics(callback: RealtimeCallback<any>, options?: SubscriptionOptions): string`
Optimized topic subscription with user filtering and debouncing.

**Options:**
```typescript
{
  filter?: string;           // Database-level filter
  debounceMs?: number;       // Debounce delay (default: 2000ms)
  userId?: string;           // User-specific filtering
}
```

**Features:**
- User-relevance filtering
- Device-optimized debouncing
- Connection health monitoring
- Automatic retry with exponential backoff

#### `subscribeToRequestUpdates(callback: RealtimeCallback<any>, options?: RequestUpdateOptions): string`
Enhanced subscription for request-sensitive updates.

**Features:**
- Immediate request change detection
- Optimized for join request workflows
- Reduced server load through intelligent filtering
- Connection health monitoring

### Mobile Optimizer (`src/lib/mobile-optimizations.ts`)

#### `getOptimizedTimeout(baseTimeout: number): number`
Calculates device-optimized timeouts.

**Logic:**
- iOS devices: 1.5x multiplier
- Slow connections: 2x multiplier
- Maximum: 60 seconds

#### `getOptimizedMediaConstraints(): MediaStreamConstraints`
Returns device-appropriate media constraints.

**Profiles:**
- **iOS/Low Memory**: 480x360, 15fps, 16kHz audio
- **Slow Connection**: 320x240, 10fps
- **Default**: 1280x720, 30fps, 48kHz audio

#### `shouldThrottleOperation(operationType: 'network' | 'webrtc' | 'realtime'): boolean`
Determines if operations should be throttled based on device capabilities.

## 🎨 UI Components

### Modern Chat Panel (`src/components/harthio/modern-chat-panel.tsx`)

#### Props
```typescript
interface ModernChatPanelProps {
  sessionId: string;
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}
```

**Features:**
- Real-time message synchronization
- Typing indicators
- Message status indicators
- Mobile-optimized interface
- Accessibility compliant

### Enhanced Messaging Panel (`src/components/session/enhanced-messaging-panel.tsx`)

#### Props
```typescript
interface EnhancedMessagingPanelProps {
  topicId: string;
  currentUserId: string;
  isSessionActive: boolean;
  onMessageSent?: (message: Message) => void;
}
```

**Features:**
- Advanced message composition
- File attachment support
- Emoji picker integration
- Message search functionality
- Export conversation feature

### Session Settings Modal (`src/components/session/session-settings-modal.tsx`)

#### Props
```typescript
interface SessionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  userRole: 'author' | 'participant';
}
```

**Features:**
- Audio/video quality settings
- Notification preferences
- Privacy controls
- Recording permissions
- Accessibility options

## 🔍 Admin Components

### Admin Analytics (`src/components/admin/admin-analytics.tsx`)

#### Features
- Real-time user metrics
- Session completion analytics
- Device and browser statistics
- Geographic usage patterns
- Performance monitoring dashboard

#### Key Metrics
```typescript
interface AnalyticsMetrics {
  activeUsers: number;
  sessionsToday: number;
  completionRate: number;
  averageSessionDuration: number;
  deviceBreakdown: DeviceStats[];
  locationStats: LocationStats[];
}
```

### Server Status Checker (`src/components/debug/server-status-checker.tsx`)

#### Features
- Real-time server health monitoring
- Connection quality testing
- WebRTC server status
- Database connection monitoring
- Performance metrics display

## 🛠️ Utility Functions

### Connection Health Monitor (`src/lib/connection-health-monitor.ts`)

#### `monitorConnection(options: MonitoringOptions): ConnectionMonitor`
Monitors connection health with automatic recovery.

**Options:**
```typescript
{
  checkInterval: number;     // Health check interval (default: 5000ms)
  timeoutThreshold: number;  // Timeout threshold (default: 10000ms)
  retryAttempts: number;     // Max retry attempts (default: 3)
  onHealthChange: (healthy: boolean) => void;
}
```

### Feature Flags (`src/lib/feature-flags.ts`)

#### `isFeatureEnabled(flag: string, userId?: string): boolean`
Checks if a feature flag is enabled for a user.

**Supported Flags:**
- `enhanced-chat`: Modern chat panel
- `admin-analytics`: Advanced analytics
- `mobile-optimizations`: Mobile performance features
- `debug-tools`: Development debugging tools

### SEO Utilities (`src/lib/seo.ts`)

#### `generateMetaTags(page: PageMetadata): MetaTag[]`
Generates optimized meta tags for pages.

#### `generateStructuredData(type: SchemaType, data: any): StructuredData`
Creates schema.org structured data.

**Supported Types:**
- `Organization`
- `WebApplication`
- `Event` (for sessions)
- `Person` (for user profiles)

## 🔐 Security Functions

### Enhanced Validation (`src/lib/enhanced-form-validation.ts`)

#### `validateSessionData(data: SessionData): ValidationResult`
Comprehensive session data validation.

#### `sanitizeUserInput(input: string, type: InputType): string`
Sanitizes user input based on context.

**Input Types:**
- `message`: Chat messages
- `topic-title`: Session titles
- `description`: Session descriptions
- `username`: User display names

### Security Utils (`src/lib/security-utils.ts`)

#### `detectSuspiciousActivity(event: SecurityEvent): ThreatLevel`
Analyzes security events for threats.

**Threat Levels:**
- `low`: Minor anomalies
- `medium`: Suspicious patterns
- `high`: Potential threats
- `critical`: Active attacks

## 📱 Mobile Hooks

### Screen Dimensions (`src/hooks/use-screen-dimensions.ts`)

#### `useScreenDimensions(): ScreenInfo`
Provides responsive screen information.

**Returns:**
```typescript
{
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
}
```

### Message Panel (`src/hooks/use-message-panel.ts`)

#### `useMessagePanel(sessionId: string): MessagePanelState`
Manages message panel state and interactions.

**State:**
```typescript
{
  isOpen: boolean;
  messages: Message[];
  unreadCount: number;
  isTyping: boolean;
  sendMessage: (text: string) => Promise<void>;
  togglePanel: () => void;
  markAsRead: () => void;
}
```

## 🔄 Real-time Events

### Custom Events

#### `harthio:background`
Fired when app goes to background (mobile).

#### `harthio:foreground`
Fired when app returns to foreground.

#### `harthio:memory-cleanup`
Fired when memory cleanup is triggered.

#### `harthio:orientation-change`
Fired on device orientation change.

### Real-time Callbacks

#### `RealtimeCallback<T>`
```typescript
type RealtimeCallback<T> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
}) => void;
```

## 📊 Performance Monitoring

### Metrics Collection

#### `PerformanceMetrics`
```typescript
interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  webRTCConnectionTime: number;
  databaseQueryTime: number;
}
```

### Error Tracking

#### `ErrorEvent`
```typescript
interface ErrorEvent {
  type: 'javascript' | 'network' | 'webrtc' | 'database';
  message: string;
  stack?: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
```

## 🧪 Testing Utilities

### Mock Services

#### `createMockTopicService(): MockTopicService`
Creates mock topic service for testing.

#### `createMockRealtimeManager(): MockRealtimeManager`
Creates mock real-time manager for testing.

### Test Helpers

#### `waitForRealtimeUpdate(timeout?: number): Promise<void>`
Waits for real-time updates in tests.

#### `simulateNetworkConditions(type: 'slow' | 'fast' | 'offline'): void`
Simulates different network conditions.

---

*Last Updated: October 2025*
*API Version: 2.0.0*