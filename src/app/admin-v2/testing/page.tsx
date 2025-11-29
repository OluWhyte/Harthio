'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { RobustWebRTCTest } from '@/components/admin/robust-webrtc-test';
import { SessionQualityAnalytics } from '@/components/admin/session-quality-analytics';
import { SecurityTestSuite } from '@/components/admin/security-test-suite';
import { 
  TestTube, 
  Database, 
  Mail, 
  Bell, 
  Video,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  Zap,
  Users,
  Calendar,
  Shield,
  BarChart3
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  duration?: number;
}

export default function TestingToolsPage() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('Test Email from Harthio');
  const [emailBody, setEmailBody] = useState('This is a test email sent from the admin testing panel.');
  const [notificationUserId, setNotificationUserId] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('Test notification');
  
  const { toast } = useToast();

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Database Connection Tests
  const testDatabaseConnection = async () => {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      const duration = Date.now() - startTime;
      
      if (error) throw error;
      
      addTestResult({
        name: 'Database Connection',
        status: 'success',
        message: 'Successfully connected to Supabase',
        duration
      });
    } catch (error: any) {
      addTestResult({
        name: 'Database Connection',
        status: 'error',
        message: error.message || 'Failed to connect'
      });
    }
  };

  const testUserTableAccess = async () => {
    const startTime = Date.now();
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      const duration = Date.now() - startTime;
      
      if (error) throw error;
      
      addTestResult({
        name: 'Users Table Access',
        status: 'success',
        message: `Found ${count} users in database`,
        duration
      });
    } catch (error: any) {
      addTestResult({
        name: 'Users Table Access',
        status: 'error',
        message: error.message || 'Failed to access users table'
      });
    }
  };

  const testTopicsTableAccess = async () => {
    const startTime = Date.now();
    try {
      const { count, error } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true });
      
      const duration = Date.now() - startTime;
      
      if (error) throw error;
      
      addTestResult({
        name: 'Topics Table Access',
        status: 'success',
        message: `Found ${count} topics in database`,
        duration
      });
    } catch (error: any) {
      addTestResult({
        name: 'Topics Table Access',
        status: 'error',
        message: error.message || 'Failed to access topics table'
      });
    }
  };

  const testMessagesTableAccess = async () => {
    const startTime = Date.now();
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });
      
      const duration = Date.now() - startTime;
      
      if (error) throw error;
      
      addTestResult({
        name: 'Messages Table Access',
        status: 'success',
        message: `Found ${count} messages in database`,
        duration
      });
    } catch (error: any) {
      addTestResult({
        name: 'Messages Table Access',
        status: 'error',
        message: error.message || 'Failed to access messages table'
      });
    }
  };

  const testRecoveryTablesAccess = async () => {
    const startTime = Date.now();
    try {
      const { count, error } = await supabase
        .from('sobriety_trackers')
        .select('*', { count: 'exact', head: true });
      
      const duration = Date.now() - startTime;
      
      if (error) throw error;
      
      addTestResult({
        name: 'Recovery Tables Access',
        status: 'success',
        message: `Found ${count} sobriety trackers`,
        duration
      });
    } catch (error: any) {
      addTestResult({
        name: 'Recovery Tables Access',
        status: 'error',
        message: error.message || 'Failed to access recovery tables'
      });
    }
  };

  const runAllDatabaseTests = async () => {
    setLoading(true);
    clearResults();
    
    await testDatabaseConnection();
    await testUserTableAccess();
    await testTopicsTableAccess();
    await testMessagesTableAccess();
    await testRecoveryTablesAccess();
    
    setLoading(false);
    toast({
      title: 'Database Tests Complete',
      description: 'All database tests have finished running.',
    });
  };

  // Email Tests
  const sendTestEmail = async () => {
    if (!emailTo) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          body: emailBody
        })
      });

      if (!response.ok) throw new Error('Failed to send email');

      addTestResult({
        name: 'Email Test',
        status: 'success',
        message: `Test email sent to ${emailTo}`
      });

      toast({
        title: 'Email Sent',
        description: `Test email sent to ${emailTo}`,
      });
    } catch (error: any) {
      addTestResult({
        name: 'Email Test',
        status: 'error',
        message: error.message || 'Failed to send email'
      });

      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Notification Tests
  const sendTestNotification = async () => {
    if (!notificationUserId) {
      toast({
        title: 'Error',
        description: 'Please enter a user ID',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notificationUserId,
          title: 'Test Notification',
          message: notificationMessage,
          type: 'general',
          read: false
        });

      if (error) throw error;

      addTestResult({
        name: 'Notification Test',
        status: 'success',
        message: `Notification sent to user ${notificationUserId}`
      });

      toast({
        title: 'Notification Sent',
        description: `Test notification sent to user`,
      });
    } catch (error: any) {
      addTestResult({
        name: 'Notification Test',
        status: 'error',
        message: error.message || 'Failed to send notification'
      });

      toast({
        title: 'Error',
        description: 'Failed to send test notification',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // WebRTC Tests
  const testWebRTCSupport = () => {
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasRTCPeerConnection = !!(window.RTCPeerConnection);
    
    if (hasGetUserMedia && hasRTCPeerConnection) {
      addTestResult({
        name: 'WebRTC Support',
        status: 'success',
        message: 'Browser supports WebRTC video calls'
      });
    } else {
      addTestResult({
        name: 'WebRTC Support',
        status: 'error',
        message: 'Browser does not support WebRTC'
      });
    }
  };

  const testCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      addTestResult({
        name: 'Camera/Microphone Access',
        status: 'success',
        message: 'Successfully accessed camera and microphone'
      });
    } catch (error: any) {
      addTestResult({
        name: 'Camera/Microphone Access',
        status: 'error',
        message: error.message || 'Failed to access camera/microphone'
      });
    }
  };

  // AI Integration Tests
  const testAIService = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello, this is a test message',
          userId: 'test-user'
        })
      });

      if (!response.ok) throw new Error('AI service not responding');

      addTestResult({
        name: 'AI Service',
        status: 'success',
        message: 'AI service is responding correctly'
      });
    } catch (error: any) {
      addTestResult({
        name: 'AI Service',
        status: 'error',
        message: error.message || 'AI service test failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Testing Tools</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Test platform features and integrations</p>
        </div>
        <Button variant="outline" onClick={clearResults} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Clear Results
        </Button>
      </div>

      {/* Test Results Panel */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.name}</p>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                  {result.duration && (
                    <Badge variant="outline">{result.duration}ms</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testing Tabs */}
      <Tabs defaultValue="webrtc" className="space-y-4">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="webrtc" className="whitespace-nowrap">WebRTC</TabsTrigger>
            <TabsTrigger value="quality" className="whitespace-nowrap">Quality</TabsTrigger>
            <TabsTrigger value="security" className="whitespace-nowrap">Security</TabsTrigger>
            <TabsTrigger value="database" className="whitespace-nowrap">Database</TabsTrigger>
            <TabsTrigger value="email" className="whitespace-nowrap">Email</TabsTrigger>
            <TabsTrigger value="notifications" className="whitespace-nowrap">Notifications</TabsTrigger>
            <TabsTrigger value="ai" className="whitespace-nowrap">AI</TabsTrigger>
          </TabsList>
        </div>

        {/* WebRTC Comprehensive Tests */}
        <TabsContent value="webrtc" className="space-y-4">
          <RobustWebRTCTest />
        </TabsContent>

        {/* Session Quality Analytics */}
        <TabsContent value="quality" className="space-y-4">
          <SessionQualityAnalytics />
        </TabsContent>

        {/* Security Tests */}
        <TabsContent value="security" className="space-y-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">OWASP Security Center</h3>
              <p className="text-sm text-muted-foreground">
                Monitor security events, test OWASP implementations, and ensure compliance
              </p>
            </div>
            <SecurityTestSuite />
          </div>
        </TabsContent>

        {/* Database Tests */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Connection Tests
              </CardTitle>
              <CardDescription>
                Test database connectivity and table access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={runAllDatabaseTests} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Run All Database Tests
                  </>
                )}
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button variant="outline" onClick={testDatabaseConnection} disabled={loading}>
                  Test Connection
                </Button>
                <Button variant="outline" onClick={testUserTableAccess} disabled={loading}>
                  <Users className="h-4 w-4 mr-2" />
                  Test Users Table
                </Button>
                <Button variant="outline" onClick={testTopicsTableAccess} disabled={loading}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Test Topics Table
                </Button>
                <Button variant="outline" onClick={testMessagesTableAccess} disabled={loading}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Test Messages Table
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tests */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Service Tests
              </CardTitle>
              <CardDescription>
                Send test emails to verify email service configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email-to">Recipient Email</Label>
                <Input
                  id="email-to"
                  type="email"
                  placeholder="test@example.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="email-body">Message</Label>
                <Textarea
                  id="email-body"
                  rows={4}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>

              <Button onClick={sendTestEmail} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Tests */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification System Tests
              </CardTitle>
              <CardDescription>
                Send test notifications to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="user-id">User ID</Label>
                <Input
                  id="user-id"
                  placeholder="Enter user UUID"
                  value={notificationUserId}
                  onChange={(e) => setNotificationUserId(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notification-message">Notification Message</Label>
                <Textarea
                  id="notification-message"
                  rows={3}
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                />
              </div>

              <Button onClick={sendTestNotification} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test Notification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>



        {/* AI Tests */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Service Tests
              </CardTitle>
              <CardDescription>
                Test AI chat and moderation services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={testAIService} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing AI Service...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Test AI Chat Service
                  </>
                )}
              </Button>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> AI tests require valid API keys in environment variables.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
