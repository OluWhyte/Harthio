'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useAdmin } from '@/contexts/admin-context';
import { Loader2, Settings as SettingsIcon, DollarSign, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/admin-v2/login');
      return;
    }
  }, [user, isAdmin, router]);

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure platform-wide features and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Looking for monetization settings?</strong> Pro tier, Credits, and Trial settings have been moved to the{' '}
            <Link href="/admin-v2/monetization" className="underline font-semibold">
              Monetization page
            </Link>
            .
          </AlertDescription>
        </Alert>

        {/* Placeholder for future settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-gray-600" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>
              Platform-wide configuration options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <SettingsIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Settings Available Yet
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                General platform settings will be added here. For now, all monetization settings are in the Monetization page.
              </p>
              <Link href="/admin-v2/monetization">
                <Button>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Go to Monetization
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Future Settings Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="opacity-50">
            <CardHeader>
              <CardTitle className="text-base">Email Notifications</CardTitle>
              <CardDescription className="text-xs">
                Configure system email settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Coming soon...</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader>
              <CardTitle className="text-base">Security Settings</CardTitle>
              <CardDescription className="text-xs">
                Platform security configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Coming soon...</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader>
              <CardTitle className="text-base">Feature Flags</CardTitle>
              <CardDescription className="text-xs">
                Enable/disable platform features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Coming soon...</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader>
              <CardTitle className="text-base">System Maintenance</CardTitle>
              <CardDescription className="text-xs">
                Maintenance mode and system status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
