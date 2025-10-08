'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { BlogService } from '@/lib/services/blog-service';

export default function DebugAdminPage() {
  const { user } = useAuth();
  const [adminStatus, setAdminStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const isAdmin = await BlogService.isUserAdmin(user!.uid);
      setAdminStatus(isAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setAdminStatus(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Admin Status</h1>
      
      <div className="space-y-4">
        <div>
          <strong>User ID:</strong> {user?.uid || 'Not logged in'}
        </div>
        
        <div>
          <strong>Email:</strong> {user?.email || 'Not available'}
        </div>
        
        <div>
          <strong>Admin Status:</strong> {
            adminStatus === null ? 'Unknown' : 
            adminStatus ? 'Admin' : 'Not Admin'
          }
        </div>
      </div>
    </div>
  );
}