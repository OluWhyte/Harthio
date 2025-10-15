"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/common/logo";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    logIn,
    resendVerificationEmail,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      console.log('User already logged in, redirecting to dashboard...');
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResendVerification(false);

    try {
      // Add timeout protection for login
      const loginPromise = logIn(email, password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout - please try again')), 30000)
      );
      
      await Promise.race([loginPromise, timeoutPromise]);
      
      // Login successful - redirect will be handled by useEffect when user state updates
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting to dashboard...",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      // Show resend verification option if email not confirmed
      if (errorMessage.includes("verification link")) {
        setShowResendVerification(true);
      }

      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      });
      setLoading(false); // Only reset loading on error
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setResendLoading(true);
    try {
      await resendVerificationEmail(email);
      toast({
        title: "Verification Email Sent",
        description: "Please check your email and click the verification link.",
      });
      setShowResendVerification(false);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to resend verification email.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  // Show loading during initial auth check
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirect message if user is logged in
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center border-b bg-white/80 backdrop-blur-sm">
        <Link
          href="/"
          className="flex items-center justify-center"
          prefetch={false}
        >
          <Logo />
        </Link>
        <nav className="ml-auto">
          <Button variant="ghost" asChild className="text-sm px-2 sm:px-4">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-sm sm:max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Log in to your Harthio account to continue connecting.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">
                  Password
                </Label>
                <PasswordInput
                  id="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="text-right text-xs sm:text-sm">
                <Link
                  href="/forgot-password"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-sm sm:text-base py-2 sm:py-3"
                disabled={loading}
              >
                {loading ? "Logging In..." : "Log In"}
              </Button>
              {showResendVerification && (
                <div className="mt-4 p-3 sm:p-4 bg-accent/10 border border-accent/20 rounded-md">
                  <p className="text-xs sm:text-sm text-accent mb-2">
                    Your email address needs to be verified before you can log
                    in.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="w-full text-xs sm:text-sm"
                  >
                    {resendLoading ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </div>
              )}
            </form>
            <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Sign Up
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
