'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function BulkVerifyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBulkVerify = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/bulk-verify-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Bulk Verification Complete',
          description: `Successfully verified ${result.successCount} users. ${result.errorCount} errors.`,
        });
      } else {
        throw new Error(result.error || 'Failed to bulk verify users');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to bulk verify users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk User Verification</CardTitle>
          <CardDescription>
            Verify all unverified users in the system. This will mark their email addresses as confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleBulkVerify} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Verifying Users...' : 'Bulk Verify All Users'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}