
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/common/logo';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading, logIn, resendVerificationEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResendVerification(false);

    try {
      await logIn(email, password);
      // The auth provider will handle routing on success
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      
      // Show resend verification option if email not confirmed
      if (errorMessage.includes('verification link')) {
        setShowResendVerification(true);
      }
      
      toast({
        title: 'Login Error',
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
  
  if (authLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Log in to your Harthio account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="jane.doe@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password" 
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="text-right text-sm">
                <Link href="/forgot-password" className="underline text-muted-foreground">
                  Forgot Password?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging In...' : 'Log In'}
              </Button>
              {showResendVerification && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 mb-2">
                    Your email address needs to be verified before you can log in.
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
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline">
                Sign Up
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
