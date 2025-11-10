"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Mail, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [unsubscribeMarketing, setUnsubscribeMarketing] = useState(true);
  const [unsubscribeAll, setUnsubscribeAll] = useState(false);

  const handleUnsubscribe = async () => {
    if (!token) {
      setError("Invalid unsubscribe link");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if user exists
      const { data: user, error: userError } = await (supabase as any)
        .from("users")
        .select("id, email")
        .eq("id", token)
        .single();

      if (userError || !user) {
        throw new Error("Invalid unsubscribe token");
      }

      // Check if preferences exist
      const { data: existingPrefs } = await (supabase as any)
        .from("user_email_preferences")
        .select("*")
        .eq("user_id", token)
        .single();

      if (existingPrefs) {
        // Update existing preferences
        const { error: updateError } = await (supabase as any)
          .from("user_email_preferences")
          .update({
            unsubscribed_marketing: unsubscribeMarketing,
            unsubscribed_all: unsubscribeAll,
            unsubscribed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", token);

        if (updateError) throw updateError;
      } else {
        // Create new preferences
        const { error: insertError } = await (supabase as any)
          .from("user_email_preferences")
          .insert({
            user_id: token,
            unsubscribed_marketing: unsubscribeMarketing,
            unsubscribed_all: unsubscribeAll,
            unsubscribed_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Unsubscribe error:", err);
      setError(err instanceof Error ? err.message : "Failed to unsubscribe");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-center">Invalid Link</CardTitle>
            <CardDescription className="text-center">
              This unsubscribe link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button>Return to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-center">Successfully Unsubscribed</CardTitle>
            <CardDescription className="text-center">
              Your email preferences have been updated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                {unsubscribeAll
                  ? "You will no longer receive any emails from Harthio."
                  : "You will no longer receive marketing emails. You'll still receive important account notifications."}
              </p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Changed your mind? You can update your preferences anytime in your account settings.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-center">Unsubscribe from Emails</CardTitle>
          <CardDescription className="text-center">
            We're sorry to see you go. Please select your preferences below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="marketing"
                checked={unsubscribeMarketing}
                onCheckedChange={(checked) => setUnsubscribeMarketing(checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="marketing" className="font-medium cursor-pointer">
                  Unsubscribe from marketing emails
                </Label>
                <p className="text-sm text-muted-foreground">
                  Stop receiving newsletters, product updates, and promotional emails.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="all"
                checked={unsubscribeAll}
                onCheckedChange={(checked) => setUnsubscribeAll(checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="all" className="font-medium cursor-pointer">
                  Unsubscribe from all emails
                </Label>
                <p className="text-sm text-muted-foreground">
                  Stop receiving all emails, including important account notifications.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> If you unsubscribe from all emails, you won't receive important
              notifications about your account, sessions, or join requests.
            </p>
          </div>

          <Button
            onClick={handleUnsubscribe}
            disabled={loading || (!unsubscribeMarketing && !unsubscribeAll)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating Preferences...
              </>
            ) : (
              "Update Email Preferences"
            )}
          </Button>

          <div className="text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              Cancel and return to homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
