'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings, Eye, Shield, AlertTriangle } from 'lucide-react';

export default function SessionManagementPage() {
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
                <h1 className="text-xl font-semibold text-gray-900">Session Management</h1>
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
              Session Management - Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Oversight & Safety</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Monitor active conversations, manage session reports, and ensure platform safety with comprehensive session management tools.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Eye className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium mb-2">Active Monitoring</h4>
                  <p className="text-sm text-gray-600">View live sessions and participant activity</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <h4 className="font-medium mb-2">Report Management</h4>
                  <p className="text-sm text-gray-600">Handle session reports and safety concerns</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium mb-2">Safety Controls</h4>
                  <p className="text-sm text-gray-600">Implement safety measures and moderation</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}