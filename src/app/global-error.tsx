'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/logo';
import { WifiOff, ServerCrash } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  let title = "Something Went Wrong";
  let message = "An unexpected error occurred. We've been notified and are looking into it.";
  let Icon = ServerCrash;

  // Check for chunk load errors, which often indicate a network issue or a stale deployment
  if (error.name === 'ChunkLoadError') {
    title = "App Update or Network Issue";
    message = "We couldn't load a part of the application. This can happen if you have a slow network connection or if we've just updated the app. Please refresh the page to get the latest version.";
    Icon = WifiOff;
  }

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <div className="mb-6">
                <Logo />
            </div>
            <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full">
                <Icon className="h-16 w-16 mx-auto text-destructive mb-4" />
                <h1 className="text-2xl font-bold mb-2">{title}</h1>
                <p className="text-muted-foreground mb-6">{message}</p>
                <Button onClick={() => window.location.reload()}>
                    Refresh Page
                </Button>
            </div>
             <p className="text-xs text-muted-foreground mt-8">&copy; 2024 Harthio Inc. All rights reserved.</p>
        </div>
      </body>
    </html>
  );
}
