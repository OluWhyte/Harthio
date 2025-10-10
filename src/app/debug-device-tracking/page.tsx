"use client";

import { useState, useEffect } from 'react';
import { DeviceTrackingService } from '@/lib/services/device-tracking';
import { useDeviceTracking } from '@/hooks/use-device-tracking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DebugDeviceTrackingPage() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [locationInfo, setLocationInfo] = useState<any>(null);
  const [fingerprint, setFingerprint] = useState<string>('');
  const [isReturning, setIsReturning] = useState<boolean>(false);
  const [userFootprint, setUserFootprint] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Mock user ID for testing (in real app, this would come from auth)
  const mockUserId = 'test-user-' + Math.random().toString(36).substr(2, 9);
  
  const deviceTracking = useDeviceTracking({
    userId: mockUserId,
    enabled: true,
    activityInterval: 30000 // 30 seconds for testing
  });

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    setLoading(true);
    try {
      // Get device info
      const device = DeviceTrackingService.getDeviceInfo();
      setDeviceInfo(device);

      // Generate fingerprint
      const fp = DeviceTrackingService.generateDeviceFingerprint();
      setFingerprint(fp);

      // Check if returning user
      const returning = await DeviceTrackingService.isReturningUser(fp);
      setIsReturning(returning);

      // Get location info
      const location = await DeviceTrackingService.getLocationInfo();
      setLocationInfo(location);

    } catch (error) {
      console.error('Error loading device info:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSessionTracking = async () => {
    try {
      const sessionId = await DeviceTrackingService.trackUserSession(mockUserId);
      console.log('Session tracking started:', sessionId);
    } catch (error) {
      console.error('Session tracking failed:', error);
    }
  };

  const loadUserFootprint = async () => {
    try {
      const footprint = await DeviceTrackingService.getUserFootprint(mockUserId);
      setUserFootprint(footprint);
    } catch (error) {
      console.error('Error loading user footprint:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Device Tracking Debug</h1>
        <div className="space-x-2">
          <Button onClick={loadDeviceInfo} disabled={loading}>
            Refresh Info
          </Button>
          <Button onClick={testSessionTracking}>
            Test Session Tracking
          </Button>
          <Button onClick={loadUserFootprint}>
            Load Footprint
          </Button>
        </div>
      </div>

      {/* Device Tracking Status */}
      <Card>
        <CardHeader>
          <CardTitle>Device Tracking Status</CardTitle>
          <CardDescription>Current tracking session information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center space-x-2">
            <span>Session ID:</span>
            <Badge variant={deviceTracking.sessionId ? 'default' : 'secondary'}>
              {deviceTracking.sessionId || 'Not tracking'}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <span>Is Tracking:</span>
            <Badge variant={deviceTracking.isTracking ? 'default' : 'destructive'}>
              {deviceTracking.isTracking ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {deviceTracking.error && (
            <div className="text-red-600">Error: {deviceTracking.error}</div>
          )}
        </CardContent>
      </Card>

      {/* Device Information */}
      <Card>
        <CardHeader>
          <CardTitle>Device Information</CardTitle>
          <CardDescription>Detected device and browser information</CardDescription>
        </CardHeader>
        <CardContent>
          {deviceInfo ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Browser:</strong> {deviceInfo.browser} {deviceInfo.browser_version}</div>
              <div><strong>OS:</strong> {deviceInfo.os} {deviceInfo.os_version}</div>
              <div><strong>Device Type:</strong> {deviceInfo.device_type}</div>
              <div><strong>Device Vendor:</strong> {deviceInfo.device_vendor || 'Unknown'}</div>
              <div><strong>Screen:</strong> {deviceInfo.screen_resolution}</div>
              <div><strong>Timezone:</strong> {deviceInfo.timezone}</div>
              <div><strong>Language:</strong> {deviceInfo.language}</div>
              <div><strong>Device Model:</strong> {deviceInfo.device_model || 'Unknown'}</div>
            </div>
          ) : (
            <div>Loading device information...</div>
          )}
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle>Location Information</CardTitle>
          <CardDescription>Detected location based on IP or GPS</CardDescription>
        </CardHeader>
        <CardContent>
          {locationInfo ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Country:</strong> {locationInfo.country} ({locationInfo.country_code})</div>
              <div><strong>Region:</strong> {locationInfo.region || 'Unknown'}</div>
              <div><strong>City:</strong> {locationInfo.city || 'Unknown'}</div>
              <div><strong>Timezone:</strong> {locationInfo.timezone || 'Unknown'}</div>
              <div><strong>ISP:</strong> {locationInfo.isp || 'Unknown'}</div>
              <div><strong>Coordinates:</strong> 
                {locationInfo.latitude && locationInfo.longitude 
                  ? `${locationInfo.latitude}, ${locationInfo.longitude}`
                  : 'Not available'
                }
              </div>
            </div>
          ) : (
            <div>Loading location information...</div>
          )}
        </CardContent>
      </Card>

      {/* Device Fingerprint */}
      <Card>
        <CardHeader>
          <CardTitle>Device Fingerprint</CardTitle>
          <CardDescription>Unique identifier for this device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Fingerprint:</strong> {fingerprint}</div>
          <div className="flex items-center space-x-2">
            <span><strong>Returning User:</strong></span>
            <Badge variant={isReturning ? 'default' : 'secondary'}>
              {isReturning ? 'Yes' : 'No'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* User Footprint */}
      {userFootprint && (
        <Card>
          <CardHeader>
            <CardTitle>User Footprint</CardTitle>
            <CardDescription>Aggregated user activity data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Total Sessions:</strong> {userFootprint.footprint?.total_sessions || 0}</div>
              <div><strong>Unique Devices:</strong> {userFootprint.footprint?.unique_devices || 0}</div>
              <div><strong>Unique IPs:</strong> {userFootprint.footprint?.unique_ip_addresses || 0}</div>
              <div><strong>Countries:</strong> {userFootprint.footprint?.unique_countries || 0}</div>
              <div><strong>Engagement:</strong> {userFootprint.footprint?.engagement_level || 'Low'}</div>
              <div><strong>Recent Sessions:</strong> {userFootprint.recent_sessions?.length || 0}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
          <CardDescription>Manual testing controls</CardDescription>
        </CardHeader>
        <CardContent className="space-x-2">
          <Button 
            onClick={() => deviceTracking.updateActivity()}
            disabled={!deviceTracking.sessionId}
          >
            Update Activity
          </Button>
          <Button 
            onClick={() => deviceTracking.checkReturningUser()}
          >
            Check Returning User
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Reload Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}