'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAIPage() {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const runDiagnostics = async () => {
      const diag: any = {
        timestamp: new Date().toISOString(),
        user: null,
        session: null,
        env: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }
      };

      // Check user from hook
      if (user) {
        diag.user = {
          id: (user as any).id,
          uid: user.uid,
          email: user.email,
        };
      }

      // Check Supabase session directly
      try {
        const { supabase } = await import('@/lib/supabase');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
          diag.session = {
            userId: session.user.id,
            email: session.user.email,
            hasAccessToken: !!session.access_token,
            tokenLength: session.access_token?.length,
          };
        } else {
          diag.session = { error: error?.message || 'No session found' };
        }
      } catch (error: any) {
        diag.session = { error: error.message };
      }

      setDiagnostics(diag);
    };

    runDiagnostics();
  }, [user]);

  const testAIChat = async () => {
    setLoading(true);
    setTestResult('Testing...');

    try {
      // Use the singleton supabase client
      const { supabase } = await import('@/lib/supabase');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setTestResult('❌ No session found - not logged in');
        setLoading(false);
        return;
      }

      // Get CSRF token
      const { getCSRFHeaders } = await import('@/lib/csrf-utils');
      const csrfHeaders = await getCSRFHeaders();

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          ...csrfHeaders,
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Hello, this is a test message' }
          ]
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult(`✅ Success!\n\nAI Response: ${data.message}\n\nRate Limit: ${data.rateLimit?.remaining}/${data.rateLimit?.limit} remaining`);
      } else {
        setTestResult(`❌ Error ${response.status}\n\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      setTestResult(`❌ Exception: ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <h1 className="text-3xl font-bold">AI Chat Diagnostics</h1>

      <Card>
        <CardHeader>
          <CardTitle>System Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded text-xs overflow-auto">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test AI Chat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testAIChat} disabled={loading}>
            {loading ? 'Testing...' : 'Send Test Message'}
          </Button>

          {testResult && (
            <pre className="bg-muted p-4 rounded text-xs overflow-auto whitespace-pre-wrap">
              {testResult}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expected Values</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>✅ user.id should be a UUID (not undefined)</li>
            <li>✅ session.userId should match user.id</li>
            <li>✅ session.hasAccessToken should be true</li>
            <li>✅ env.supabaseUrl should be set</li>
            <li>✅ env.hasAnonKey should be true</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
