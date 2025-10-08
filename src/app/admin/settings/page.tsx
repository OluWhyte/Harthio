'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings, Globe, Bell, Shield, Palette } from 'lucide-react';

export default function PlatformSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Logo />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Dashboard
                  </Link>
                </Button>
                <span className="text-gray-400">/</span>
                <h1 className="text-xl font-semibold text-gray-900">Platform Settings</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Coming Soon Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Platform Configuration - Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform Configuration</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Configure platform settings, manage categories, control system features, and customize the user experience.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Globe className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium mb-2">General Settings</h4>
                  <p className="text-sm text-gray-600">Platform name, description, and basic configuration</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Bell className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium mb-2">Notifications</h4>
                  <p className="text-sm text-gray-600">Email templates and notification settings</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <h4 className="font-medium mb-2">Safety & Moderation</h4>
                  <p className="text-sm text-gray-600">Content policies and safety controls</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Palette className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium mb-2">Appearance</h4>
                  <p className="text-sm text-gray-600">Themes, branding, and UI customization</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}