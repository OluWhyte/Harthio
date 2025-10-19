# Migration Guide - 2025 Platform Updates

## Overview

This guide helps developers understand and migrate to the new 2025 platform enhancements.

## 🔄 Breaking Changes

### 1. Real-time Manager Updates

**Old Usage:**

```typescript
// Old subscription method
const channel = realtimeManager.subscribeToTopics(callback);
```

**New Usage:**

```typescript
// New optimized subscription with options
const channelId = realtimeManager.subscribeToTopics(callback, {
  debounceMs: 2000,
  userId: user.uid,
  filter: "author_id.eq.userId",
});
```

### 2. Mobile Optimization Integration

**Old Timeout Handling:**

```typescript
// Fixed timeout values
const timeout = 10000;
```

**New Adaptive Timeouts:**

```typescript
// Device-optimized timeouts
const timeout = mobileOptimizer.getOptimizedTimeout(10000);
```

### 3. Enhanced Error Handling

**Old Error Handling:**

```typescript
// Basic try-catch
try {
  const result = await apiCall();
} catch (error) {
  console.error(error);
}
```

**New Enhanced Error Handling:**

```typescript
// Comprehensive error handling with recovery
try {
  const result = await withTimeout(apiCall(), {
    operation: "api_call",
    baseTimeout: 10000,
  });
} catch (error) {
  if (error instanceof TimeoutError) {
    // Handle timeout specifically
    return handleTimeout(error);
  }
  throw error;
}
```

## 🆕 New Features Integration

### 1. Modern Chat Panel

```typescript
import { ModernChatPanel } from "@/components/harthio/modern-chat-panel";

function SessionPage({ sessionId }: { sessionId: string }) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="session-container">
      {/* Your session content */}
      <ModernChatPanel
        sessionId={sessionId}
        isVisible={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
        position="right"
      />
    </div>
  );
}
```

### 2. Enhanced Analytics

```typescript
import { AdminAnalytics } from "@/components/admin/admin-analytics";

function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <AdminAnalytics
        timeRange="week"
        refreshInterval={30000}
        showRealTime={true}
      />
    </div>
  );
}
```

### 3. Mobile Optimizations

```typescript
import { useMobileOptimizations } from "@/lib/mobile-optimizations";

function MyComponent() {
  const { capabilities, getOptimizedTimeout } = useMobileOptimizations();

  useEffect(() => {
    if (capabilities.isMobile) {
      // Mobile-specific logic
      const timeout = getOptimizedTimeout(5000);
      // Use optimized timeout
    }
  }, [capabilities]);
}
```

## 📱 Mobile-Specific Updates

### 1. Responsive Breakpoints

**New CSS Variables:**

```css
:root {
  --vh: 1vh; /* Dynamic viewport height */
  --mobile-padding: 1rem;
  --desktop-padding: 2rem;
}

/* Mobile-first responsive design */
@media (max-width: 768px) {
  .container {
    padding: var(--mobile-padding);
    height: calc(var(--vh, 1vh) * 100);
  }
}
```

### 2. Touch Gesture Support

```typescript
import { TouchGestures } from "@/components/mobile/touch-gestures";

function MobileInterface() {
  return (
    <TouchGestures
      onSwipeLeft={() => navigateNext()}
      onSwipeRight={() => navigateBack()}
      onLongPress={() => showContextMenu()}
    >
      {/* Your content */}
    </TouchGestures>
  );
}
```

## 🔐 Security Updates

### 1. Enhanced Input Validation

**Old Validation:**

```typescript
// Basic validation
if (!input || input.length === 0) {
  throw new Error("Invalid input");
}
```

**New Enhanced Validation:**

```typescript
import { validateAndSanitize } from "@/lib/enhanced-form-validation";

// Comprehensive validation and sanitization
const result = validateAndSanitize(input, {
  type: "message",
  maxLength: 500,
  allowedTags: ["b", "i", "em"],
  sanitize: true,
});

if (!result.isValid) {
  throw new Error(result.errors.join(", "));
}
```

### 2. Security Event Monitoring

```typescript
import { securityMonitor } from "@/lib/security-utils";

// Monitor security events
securityMonitor.trackEvent({
  type: "login_attempt",
  userId: user.id,
  metadata: { ip, userAgent },
});
```

## 🎨 UI Component Updates

### 1. New Loading States

```typescript
import {
  LoadingSpinner,
  SkeletonLoader,
} from "@/components/common/loading-states";

function DataComponent() {
  if (isLoading) {
    return <SkeletonLoader type="card" count={3} />;
  }

  return <div>{/* Your content */}</div>;
}
```

### 2. Enhanced Error Boundaries

```typescript
import { ErrorBoundary } from "@/components/common/error-boundary";

function App() {
  return (
    <ErrorBoundary
      enableRecovery={true}
      onError={(error, errorInfo) => {
        // Log to monitoring service
        console.error("App error:", error, errorInfo);
      }}
    >
      <YourAppContent />
    </ErrorBoundary>
  );
}
```

## 📊 Performance Monitoring

### 1. Performance Metrics

```typescript
import { PerformanceMonitor } from "@/components/common/performance-monitor";

function App() {
  return (
    <>
      <YourAppContent />
      {process.env.NODE_ENV === "development" && (
        <PerformanceMonitor
          enabled={true}
          position="bottom-right"
          metrics={["fps", "memory", "network"]}
        />
      )}
    </>
  );
}
```

### 2. Connection Health Monitoring

```typescript
import { useConnectionHealth } from "@/hooks/use-connection-health";

function SessionComponent() {
  const { isHealthy, quality, retryConnection } = useConnectionHealth();

  if (!isHealthy) {
    return (
      <div className="connection-warning">
        Connection issues detected.
        <button onClick={retryConnection}>Retry</button>
      </div>
    );
  }

  return <div>{/* Your session content */}</div>;
}
```

## 🔧 Development Tools

### 1. Debug Components

```typescript
import { ServerStatusChecker } from "@/components/debug/server-status-checker";

function DebugPage() {
  return (
    <div className="debug-dashboard">
      <ServerStatusChecker
        servers={["database", "webrtc", "realtime"]}
        checkInterval={5000}
        showDetails={true}
      />
    </div>
  );
}
```

### 2. Feature Flags

```typescript
import { isFeatureEnabled } from "@/lib/feature-flags";

function ConditionalFeature() {
  if (!isFeatureEnabled("enhanced-chat", user.id)) {
    return <LegacyChatComponent />;
  }

  return <ModernChatPanel />;
}
```

## 📋 Migration Checklist

### Phase 1: Core Updates

- [ ] Update real-time subscriptions to use new options
- [ ] Integrate mobile optimizations for timeouts
- [ ] Update error handling to use new utilities
- [ ] Test responsive design on mobile devices

### Phase 2: Feature Integration

- [ ] Replace old chat components with modern panels
- [ ] Integrate enhanced analytics dashboard
- [ ] Add security monitoring to critical flows
- [ ] Update loading states and error boundaries

### Phase 3: Performance Optimization

- [ ] Add performance monitoring to key components
- [ ] Implement connection health monitoring
- [ ] Optimize mobile experience with new utilities
- [ ] Add debug tools for development

### Phase 4: Testing & Validation

- [ ] Test all new components thoroughly
- [ ] Validate mobile experience across devices
- [ ] Verify security enhancements are working
- [ ] Performance test with monitoring tools

## 🆘 Troubleshooting

### Common Issues

#### 1. Real-time Subscriptions Not Working

```typescript
// Check subscription health
const health = realtimeManager.monitorSubscriptionHealth();
console.log("Subscription health:", health);

// Verify user filtering
const channelId = realtimeManager.subscribeToTopics(callback, {
  userId: user.uid, // Make sure this is set
  debounceMs: 2000,
});
```

#### 2. Mobile Performance Issues

```typescript
// Check device capabilities
const capabilities = mobileOptimizer.getDeviceCapabilities();
console.log("Device capabilities:", capabilities);

// Use appropriate optimizations
if (capabilities.memoryLimit === "low") {
  // Reduce feature complexity
}
```

#### 3. Timeout Errors

```typescript
// Check if timeouts are too aggressive
const baseTimeout = 10000;
const optimizedTimeout = mobileOptimizer.getOptimizedTimeout(baseTimeout);
console.log(`Timeout: ${baseTimeout}ms -> ${optimizedTimeout}ms`);
```

## 📞 Support

For migration support:

1. Check the comprehensive documentation files
2. Review the API reference for detailed function signatures
3. Test changes in development environment first
4. Monitor performance and error rates after deployment

---

_Migration Guide Version: 1.0_
_Last Updated: October 2025_
