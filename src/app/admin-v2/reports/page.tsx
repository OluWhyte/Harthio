'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, MessageSquare, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const reports = [
    {
      id: 'user-reports',
      title: 'User Reports',
      description: 'Detailed user activity and engagement reports',
      icon: Users,
      href: '/admin-v2/reports/users',
      status: 'coming-soon'
    },
    {
      id: 'session-reports',
      title: 'Session Reports',
      description: 'Session analytics and performance metrics',
      icon: MessageSquare,
      href: '/admin-v2/reports/sessions',
      status: 'coming-soon'
    },
    {
      id: 'ai-reports',
      title: 'AI Usage Reports',
      description: 'AI chat and interaction analytics',
      icon: FileText,
      href: '/admin-v2/reports/ai',
      status: 'coming-soon'
    },
    {
      id: 'tracker-reports',
      title: 'Recovery Tracker Reports',
      description: 'Tracker usage and recovery journey insights',
      icon: Calendar,
      href: '/admin-v2/reports/trackers',
      status: 'coming-soon'
    }
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-600">
          Generate and view detailed reports for different platform metrics
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{report.description}</p>
                <Button 
                  asChild 
                  variant={report.status === 'coming-soon' ? 'outline' : 'default'}
                  disabled={report.status === 'coming-soon'}
                  className="w-full"
                >
                  <Link href={report.href}>
                    {report.status === 'coming-soon' ? 'Coming Soon' : 'View Report'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Box */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Detailed report pages are coming soon. In the meantime, you can export analytics data from the Analytics Dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
