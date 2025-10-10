'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  MapPin, 
  Clock, 
  Globe, 
  Wifi,
  Calendar,
  Activity,
  Eye,
  TrendingUp
} from 'lucide-react';

interface UserFootprintProps {
  footprint: any;
}

export function UserFootprint({ footprint }: UserFootprintProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getDeviceTypeColor = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return 'bg-green-100 text-green-800';
      case 'tablet':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  if (!footprint) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Loading user footprint...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-blue-600">{footprint.total_sessions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Devices</p>
                <p className="text-2xl font-bold text-green-600">{footprint.unique_devices}</p>
              </div>
              <Monitor className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Locations</p>
                <p className="text-2xl font-bold text-purple-600">{footprint.unique_locations}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Days Active</p>
                <p className="text-2xl font-bold text-orange-600">
                  {footprint.first_seen && footprint.last_seen 
                    ? Math.ceil((new Date(footprint.last_seen).getTime() - new Date(footprint.first_seen).getTime()) / (1000 * 60 * 60 * 24))
                    : 0
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device & Location Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Device */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Primary Device
            </CardTitle>
          </CardHeader>
          <CardContent>
            {footprint.most_used_device ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(footprint.most_used_device.device_type)}
                  <div>
                    <p className="font-medium">
                      {footprint.most_used_device.browser} on {footprint.most_used_device.os}
                    </p>
                    <p className="text-sm text-gray-600">
                      {footprint.most_used_device.browser_version} • {footprint.most_used_device.os_version}
                    </p>
                  </div>
                  <Badge className={getDeviceTypeColor(footprint.most_used_device.device_type)}>
                    {footprint.most_used_device.device_type}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Screen Resolution</p>
                    <p className="text-gray-600">{footprint.most_used_device.screen_resolution}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Language</p>
                    <p className="text-gray-600">{footprint.most_used_device.language}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Timezone</p>
                    <p className="text-gray-600">{footprint.most_used_device.timezone}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No device information available</p>
            )}
          </CardContent>
        </Card>

        {/* Most Common Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Primary Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {footprint.most_common_location ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium">
                      {footprint.most_common_location.city}, {footprint.most_common_location.region}
                    </p>
                    <p className="text-sm text-gray-600">
                      {footprint.most_common_location.country}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {footprint.most_common_location.country_code}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Country:</span>
                    <span className="text-gray-600">{footprint.most_common_location.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Region:</span>
                    <span className="text-gray-600">{footprint.most_common_location.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">City:</span>
                    <span className="text-gray-600">{footprint.most_common_location.city}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No location information available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Device History ({footprint.device_history?.length || 0} unique devices)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {footprint.device_history && footprint.device_history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {footprint.device_history.map((device: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getDeviceIcon(device.device_type)}
                    <Badge className={getDeviceTypeColor(device.device_type)} variant="secondary">
                      {device.device_type}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm">{device.browser} {device.browser_version}</p>
                  <p className="text-xs text-gray-600">{device.os} {device.os_version}</p>
                  <p className="text-xs text-gray-500 mt-1">{device.screen_resolution}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No device history available</p>
          )}
        </CardContent>
      </Card>

      {/* Location History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location History ({footprint.location_history?.length || 0} unique locations)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {footprint.location_history && footprint.location_history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {footprint.location_history.map((location: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <Badge variant="outline">{location.country_code}</Badge>
                  </div>
                  <p className="font-medium text-sm">{location.city}</p>
                  <p className="text-xs text-gray-600">{location.region}, {location.country}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No location history available</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Session Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {footprint.session_history && footprint.session_history.length > 0 ? (
            <div className="space-y-3">
              {footprint.session_history.slice(0, 10).map((session: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium capitalize">{session.activity_type} Activity</p>
                      <p className="text-xs text-gray-600">
                        {session.device_info?.browser} on {session.device_info?.os}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatDate(session.created_at)}</p>
                    {session.location_info && (
                      <p className="text-xs text-gray-400">{session.location_info.city}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent activity available</p>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {footprint.first_seen && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">First Seen:</span>
                <span className="text-gray-600">{formatDate(footprint.first_seen)}</span>
              </div>
            )}
            {footprint.last_seen && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Last Seen:</span>
                <span className="text-gray-600">{formatDate(footprint.last_seen)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Total Sessions:</span>
              <span className="text-gray-600">{footprint.total_sessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Device Diversity:</span>
              <span className="text-gray-600">{footprint.unique_devices} devices</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Geographic Reach:</span>
              <span className="text-gray-600">{footprint.unique_locations} locations</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}