'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/common/logo';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function EmailVerifiedPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified. You can now log in to your Harthio account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-sm text-green-800">
                🎉 Welcome to Harthio! Your account is now active and ready to use.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button asChild className="w-full" size="lg">
                <Link href="/login" className="flex items-center justify-center gap-2">
                  Continue to Login
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Ready to start meaningful conversations? 
                <br />
                Log in to connect with others who truly get it.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}