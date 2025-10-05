"use client";

import { Suspense } from 'react';

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, LogIn } from 'lucide-react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'access_denied':
        return 'Access was denied. You may have cancelled the login process.';
      case 'server_error':
        return 'A server error occurred. Please try again later.';
      case 'temporarily_unavailable':
        return 'The service is temporarily unavailable. Please try again later.';
      case 'invalid_request':
        return 'Invalid request. Please check your login details.';
      case 'unauthorized_client':
        return 'Unauthorized client. Please contact support.';
      case 'unsupported_response_type':
        return 'Unsupported response type.';
      default:
        return errorDescription || 'An authentication error occurred.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Authentication Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              {getErrorMessage(error)}
            </p>
            
            {error && (
              <div className="bg-gray-100 p-3 rounded-md mb-4">
                <p className="text-xs text-gray-500">
                  Error Code: {error}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">
                <LogIn className="h-4 w-4 mr-2" />
                Try Login Again
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help?{' '}
              <Link href="/contact" className="text-blue-600 hover:text-blue-500">
                Contact Support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}