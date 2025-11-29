"use client";

import { useState, ReactNode, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Calendar, Star, MessageCircle, Users, User } from "lucide-react";
import { userService } from "@/lib/supabase-services";
import { formatMemberSince, generateInitials } from "@/lib/profile-utils";

interface PublicProfileDialogProps {
  userId: string;
  children: ReactNode;
}

interface PublicUserProfile {
  id: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  headline?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  rating: number;
  reviewsCount: number;
  sessionsHosted: number;
  sessionsJoined: number;
}

// Remove duplicate function - using getUserInitials from profile-utils

export function PublicProfileDialog({
  userId,
  children,
}: PublicProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !profile && userId) {
      const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
          console.log("Fetching public profile for user:", userId);

          // Fetch user profile from Supabase
          const userProfile = await userService.getUserProfile(userId);

          if (userProfile) {
            // Get user statistics (sessions hosted/joined, ratings)
            const stats = await userService.getUserStats(userId);

            const publicProfile: PublicUserProfile = {
              id: userProfile.id,
              displayName:
                userProfile.display_name ||
                `${userProfile.first_name || ""} ${
                  userProfile.last_name || ""
                }`.trim() ||
                "Anonymous User",
              firstName: userProfile.first_name || null,
              lastName: userProfile.last_name || null,
              headline: userProfile.headline || null,
              avatarUrl: userProfile.avatar_url || null,
              createdAt: new Date(userProfile.created_at),
              rating: stats.averageRating || 0,
              reviewsCount: stats.totalReviews || 0,
              sessionsHosted: stats.sessionsHosted || 0,
              sessionsJoined: stats.sessionsJoined || 0,
            };

            setProfile(publicProfile);
          } else {
            setError("User profile not found");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setError("Failed to load user profile");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [open, profile, userId]);

  // Reset profile when dialog closes to ensure fresh data on reopen
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setProfile(null);
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Public Profile</DialogTitle>
          <DialogDescription>Community member information</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center h-48 flex flex-col items-center justify-center gap-2">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : profile ? (
          <div className="space-y-6 py-4">
            {/* Profile Header */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 bg-background border border-border">
                <AvatarImage
                  src={profile.avatarUrl || undefined}
                  alt={profile.displayName}
                />
                <AvatarFallback className="bg-background">
                  <User className="h-12 w-12 text-accent" />
                </AvatarFallback>
              </Avatar>

              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold">{profile.displayName}</h2>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatMemberSince(profile.createdAt.toISOString())}
                  </span>
                </div>
              </div>
            </div>

            {/* Headline */}
            {profile.headline && (
              <>
                <Separator />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground italic">
                    &quot;{profile.headline}&quot;
                  </p>
                </div>
              </>
            )}

            {/* Stats */}
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              {/* Rating */}
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">
                    {profile.rating > 0 ? profile.rating.toFixed(1) : "New"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {profile.reviewsCount}{" "}
                  {profile.reviewsCount === 1 ? "review" : "reviews"}
                </p>
              </div>

              {/* Sessions */}
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold">
                    {profile.sessionsHosted + profile.sessionsJoined}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">sessions joined</p>
              </div>
            </div>

            {/* Activity Badges */}
            {(profile.sessionsHosted > 0 ||
              profile.reviewsCount > 5 ||
              profile.rating >= 4.5) && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2 justify-center">
                  {profile.sessionsHosted >= 5 && (
                    <Badge variant="secondary" className="text-xs">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Active Host
                    </Badge>
                  )}
                  {profile.reviewsCount >= 10 && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      Community Member
                    </Badge>
                  )}
                  {profile.rating >= 4.5 && profile.reviewsCount >= 5 && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-yellow-100 text-yellow-800"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Top Rated
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center h-48 flex items-center justify-center">
            <p className="text-muted-foreground">
              Could not load user profile.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
