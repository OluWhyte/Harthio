'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AdminAuthService } from '@/lib/services/admin-auth-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAdminAuth() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAdminCheck = async () => {
    if (!user) {
      setResult({ error: 'No user logged in' });
      return;
    }

    setLoading(true);
    try {
      console.log('Testing admin check for user:', user.uid);
      const isAdmin = await AdminAuthService.isUserAdmin(user.uid);
      const details = await AdminAuthService.getAdminDetails(user.uid);
      
      setResult({
        userId: user.uid,
        email: user.email,
        isAdmin,
        details
      });
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Admin Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Current User:</p>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          <Button onClick={testAdminCheck} disabled={loading || !user}>
            {loading ? 'Checking...' : 'Test Admin Check'}
          </Button>

          {result && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Result:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
