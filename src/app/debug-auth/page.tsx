'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export default function DebugAuthPage() {
  const { user, userProfile, loading, createUserProfile } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const testUserProfileCreation = async () => {
    if (!user) {
      setTestResult('No user logged in');
      return;
    }

    try {
      const profile = await createUserProfile(
        user.uid,
        user.email || '',
        user.displayName
      );
      setTestResult(`Success: Created profile for ${profile.email}`);
    } catch (error: any) {
      setTestResult(`Error: ${error.message}`);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        setTestResult(`Database Error: ${error.message}`);
      } else {
        setTestResult('Database connection successful');
      }
    } catch (error: any) {
      setTestResult(`Connection Error: ${error.message}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Logged in:</strong> {user ? 'Yes' : 'No'}</p>
            {user && (
              <>
                <p><strong>User ID:</strong> {user.uid}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Display Name:</strong> {user.displayName}</p>
                <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Profile Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Profile loaded:</strong> {userProfile ? 'Yes' : 'No'}</p>
            {userProfile && (
              <>
                <p><strong>Profile ID:</strong> {userProfile.id}</p>
                <p><strong>Profile Email:</strong> {userProfile.email}</p>
                <p><strong>Display Name:</strong> {userProfile.display_name}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testDatabaseConnection}>
              Test Database Connection
            </Button>
            
            {user && (
              <Button onClick={testUserProfileCreation}>
                Test User Profile Creation
              </Button>
            )}
            
            {testResult && (
              <div className="p-4 bg-gray-100 rounded">
                <strong>Test Result:</strong> {testResult}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

