
import { ReactNode, Suspense } from 'react';
import { DashboardClientLayout } from '@/components/harthio/dashboard-client-layout';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    }>
        <DashboardClientLayout>{children}</DashboardClientLayout>
    </Suspense>
  );
}
