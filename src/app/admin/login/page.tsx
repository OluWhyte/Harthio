'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/common/logo';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { BlogService } from '@/lib/services/blog-service';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';

function AdminLoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, logIn, resendVerificationEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminAndRedirect();
    }
  }, [user, authLoading, router, searchParams]);

  const checkAdminAndRedirect = async () => {
    if (!user) return;
    
    setCheckingAdmin(true);
    try {
      const isAdmin = await BlogService.isUserAdmin(user.uid);
      
      if (isAdmin) {
        // Check for redirect parameter
        const redirectTo = searchParams.get('redirect');
        
        if (redirectTo) {
          router.push(decodeURIComponent(redirectTo));
        } else {
          router.push('/admin');
        }
      } else {
        // User is authenticated but not an admin
        toast({
          title: 'Access Denied',
          description: 'You do not have administrator privileges. Please contact support if you believe this is an error.',
          variant: 'destructive',
        });
        // Don't redirect, let them try different credentials
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast({
        title: 'Error',
        description: 'Unable to verify admin privileges. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCheckingAdmin(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResendVerification(false);

    try {
      await logIn(email, password);
      // The useEffect will handle admin checking and routing
    } catch (error: any) {
      const errorMessage = error.message || 'Invalid credentials. Please check your email and password.';
      
      // Show resend verification option if email not confirmed
      if (errorMessage.includes('verification link')) {
        setShowResendVerification(true);
      }
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address first.',
        variant: 'destructive',
      });
      return;
    }

    setResendLoading(true);
    try {
      await resendVerificationEmail(email);
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your email and click the verification link.',
      });
      setShowResendVerification(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend verification email.',
        variant: 'destructive',
      });
    } finally {
      setResendLoading(false);
    }
  };
  
  if (authLoading || checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {checkingAdmin ? 'Verifying admin privileges...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Logo />
          <div className="flex items-center gap-2 ml-4">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-gray-700">Admin Portal</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>
              Access the Harthio administration panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Security Notice */}
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Administrator Access Only</p>
                  <p className="text-xs mt-1">
                    This portal is restricted to authorized administrators. 
                    Unauthorized access attempts are logged and monitored.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input 
                  id="admin-email"
                  type="email" 
                  placeholder="admin@harthio.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <PasswordInput 
                  id="admin-password"
                  placeholder="Enter your admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-white"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90" 
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Access Admin Panel'}
              </Button>
              
              {showResendVerification && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 mb-2">
                    Your email address needs to be verified before you can access the admin panel.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="w-full"
                  >
                    {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                  </Button>
                </div>
              )}
            </form>
            
            <div className="mt-6 pt-4 border-t text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact the system administrator
              </p>
              <Link 
                href="/" 
                className="text-xs text-primary hover:underline mt-2 inline-block"
              >
                ← Back to Harthio
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}