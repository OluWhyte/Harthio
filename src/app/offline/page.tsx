import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Offline - Harthio',
  description: 'You are currently offline',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">You're Offline</h1>
          <p className="text-muted-foreground">
            It looks like you've lost your internet connection. Some features may not be available.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Try Again
          </Button>
          
          <Button
            variant="outline"
            asChild
            className="w-full"
          >
            <Link href="/">Go Home</Link>
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Tips:</p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• Check your WiFi or mobile data connection</li>
            <li>• Try moving to an area with better signal</li>
            <li>• Some cached content may still be available</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
