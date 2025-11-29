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
      console.log('User already logged in, redirecting to home...');
      router.push("/home");
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
        description: "Welcome back!",
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
      <main className="flex-1 flex items-center justify-center p-4 py-6">
        <div className="w-full max-w-md space-y-4 animate-scale-in">
          {/* Title outside card */}
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Welcome Back</h1>
          </div>
          
          <Card className="shadow-apple-lg">
          <CardContent className="p-5">
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">
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
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">
                  Password
                </Label>
                <PasswordInput
                  id="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="h-9"
                />
              </div>
              <div className="text-right text-xs">
                <Link
                  href="/forgot-password"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full h-9"
                size="sm"
                disabled={loading}
              >
                {loading ? "Logging In..." : "Log In"}
              </Button>
              {showResendVerification && (
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-apple">
                  <p className="text-xs text-accent mb-2">
                    Your email address needs to be verified before you can log in.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="w-full h-8"
                  >
                    {resendLoading ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        
        {/* Footer outside card */}
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary hover:text-primary/80 transition-colors duration-apple font-medium"
          >
            Sign Up
          </Link>
        </p>
        </div>
      </main>
    </div>
  );
}
