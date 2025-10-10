# Device Tracking System Deployment Guide

## Overview

The device tracking system captures comprehensive user footprint data including device information, location data, and session analytics. This system is designed to be privacy-conscious while providing valuable insights for user engagement and security monitoring.

## Files Created/Modified

### Database Schema

- `device-tracking-schema.sql` - Complete database schema for device tracking

### Services

- `src/lib/services/device-tracking.ts` - Core device tracking service
- `src/hooks/use-device-tracking.ts` - React hook for device tracking integration

### API Endpoints

- `src/app/api/device-tracking/session/route.ts` - Create new tracking session
- `src/app/api/device-tracking/activity/route.ts` - Update session activity
- `src/app/api/device-tracking/end-session/route.ts` - End tracking session
- `src/app/api/device-tracking/check-returning/route.ts` - Check returning user
- `src/app/api/device-tracking/footprint/[userId]/route.ts` - Get user footprint

### UI Components

- `src/app/admin/analytics/page.tsx` - Admin analytics dashboard
- `src/app/debug-device-tracking/page.tsx` - Debug/testing page

### Updated Files

- `src/components/harthio/auth-provider.tsx` - Integrated device tracking
- `src/lib/database-types.ts` - Added new table types

## Deployment Steps

### 1. Database Setup

Run the device tracking schema to create the necessary tables and functions:

```sql
-- Execute the contents of device-tracking-schema.sql
-- This creates:
-- - user_sessions table
-- - device_fingerprints table
-- - user_footprints view
-- - device_analytics view
-- - Required functions and triggers
-- - Row Level Security policies
```

### 2. Environment Variables

No additional environment variables are required. The system uses existing Supabase configuration.

### 3. Deploy Application

Deploy the updated application with the new files:

```bash
npm run build
npm run deploy
```

### 4. Test the System

1. Visit `/debug-device-tracking` to test device detection
2. Login as a user to test session tracking
3. Visit `/admin/analytics` (admin only) to view analytics

## Features

### Device Detection

- Browser type and version
- Operating system and version
- Device type (desktop/mobile/tablet)
- Screen resolution
- Timezone and language
- Device vendor and model (when available)

### Location Tracking

- IP-based geolocation
- GPS coordinates (with user permission)
- Country, region, city information
- ISP information
- Timezone detection

### Session Management

- Automatic session creation on login
- Activity tracking with configurable intervals
- Session duration calculation
- Automatic cleanup of old sessions

### Privacy Features

- Device fingerprinting (non-invasive)
- No persistent tracking cookies
- User consent for GPS location
- Automatic data cleanup
- Row Level Security (RLS) enabled

### Analytics

- User engagement levels (High/Medium/Low)
- Device and browser statistics
- Geographic distribution
- Session duration analytics
- Unique device tracking

## Security Considerations

### Row Level Security

- Users can only access their own session data
- Admin users have full access to analytics
- Device fingerprints are admin-only

### Data Privacy

- IP addresses are stored but can be anonymized
- Location data is optional and requires user consent
- Device fingerprints are hashed and non-reversible
- Automatic cleanup of old data

### Fraud Detection

- Suspicious device flagging
- Multiple account detection
- Unusual activity patterns

## API Usage

### Start Session Tracking

```javascript
import { DeviceTrackingService } from "@/lib/services/device-tracking";

const sessionId = await DeviceTrackingService.trackUserSession(userId);
```

### Update Activity

```javascript
await DeviceTrackingService.updateSessionActivity(sessionId);
```

### Get User Footprint

```javascript
const footprint = await DeviceTrackingService.getUserFootprint(userId);
```

### React Hook Usage

```javascript
import { useDeviceTracking } from "@/hooks/use-device-tracking";

function MyComponent() {
  const tracking = useDeviceTracking({
    userId: user?.id,
    enabled: true,
    activityInterval: 60000, // 1 minute
  });

  return (
    <div>
      Session ID: {tracking.sessionId}
      Is Tracking: {tracking.isTracking}
    </div>
  );
}
```

## Database Functions

### create_user_session

Creates a new user session with device and location information.

### update_session_activity

Updates the last_active timestamp for a session.

### end_user_session

Ends a user session and calculates final duration.

### check_returning_device

Checks if a device fingerprint has been seen before.

### cleanup_old_sessions

Cleans up inactive sessions (run periodically).

## Monitoring and Maintenance

### Regular Tasks

1. Run `cleanup_old_sessions()` daily to remove old data
2. Monitor device_fingerprints table for suspicious activity
3. Review user_footprints view for engagement insights
4. Check session duration averages for performance issues

### Performance Optimization

- Indexes are created for common query patterns
- JSONB fields are indexed for device and location queries
- Views are optimized for analytics queries
- Automatic session cleanup prevents data bloat

## Troubleshooting

### Common Issues

1. **Session not starting**

   - Check if user is authenticated
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **Location not detected**

   - User may have denied location permission
   - IP geolocation service may be unavailable
   - Check network connectivity

3. **Analytics not showing data**
   - Verify admin permissions
   - Check if RLS policies are correctly configured
   - Ensure sessions are being created

### Debug Tools

- Use `/debug-device-tracking` page for testing
- Check browser developer tools for API errors
- Monitor Supabase logs for database errors

## Future Enhancements

### Planned Features

- Real-time session monitoring
- Advanced fraud detection algorithms
- User behavior analytics
- Performance monitoring integration
- GDPR compliance tools

### Scalability Considerations

- Partition large tables by date
- Implement data archiving strategy
- Consider separate analytics database
- Add caching for frequently accessed data

## Compliance

### GDPR Compliance

- Users can request data deletion
- Data retention policies implemented
- Consent tracking for location data
- Right to data portability supported

### Security Standards

- Data encryption at rest and in transit
- Regular security audits recommended
- Access logging for sensitive operations
- Principle of least privilege enforced
