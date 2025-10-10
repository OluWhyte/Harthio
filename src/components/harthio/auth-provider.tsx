"use client";

import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
// import { useDeviceTracking } from "@/hooks/use-device-tracking";

// User object structure compatible with existing code
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dob: Date;
}

export type UserProfile = Database["public"]["Tables"]["users"]["Row"] & {
  ratings?: {
    politeness: { average: number; count: number };
    relevance: { average: number; count: number };
    problemSolved: { average: number; count: number };
    communication: { average: number; count: number };
    professionalism: { average: number; count: number };
  };
};

export type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logIn: (email: string, pass: string) => Promise<void>;
  logOut: () => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  createUserProfile: (
    userId: string,
    email: string,
    displayName: string | null
  ) => Promise<unknown>;
  refreshUserProfile: () => Promise<void>;
  isInOngoingSession: boolean;
  setIsInOngoingSession: (value: boolean) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInOngoingSession, setIsInOngoingSession] = useState(false);
  const router = useRouter();

  // Device tracking disabled to prevent excessive logging
  // const deviceTracking = useDeviceTracking({
  //   userId: user?.uid,
  //   enabled: !!user,
  //   activityInterval: 60000 // Update activity every minute
  // });

  const refreshUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      // First check if we have an active session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.uid)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        // If it's a permission error or profile doesn't exist, try to create it
        if (error.code === "42501" || error.code === "PGRST116") {
          console.warn("User profile not found, attempting to create it...");
          try {
            const insertResult = await (
              supabase as unknown as {
                from: (table: string) => {
                  insert: (data: Record<string, unknown>) => {
                    select: () => {
                      single: () => Promise<{
                        data:
                          | Database["public"]["Tables"]["users"]["Row"]
                          | null;
                        error: { code?: string; message?: string } | null;
                      }>;
                    };
                  };
                };
              }
            )
              .from("users")
              .insert({
                id: user.uid,
                email: user.email || "",
                display_name: user.displayName,
                first_name: user.displayName?.split(" ")[0] || null,
                last_name:
                  user.displayName?.split(" ").slice(1).join(" ") || null,
              })
              .select()
              .single();

            const { data: newProfile, error: createError } = insertResult;

            if (createError) {
              console.error("Error creating user profile:", createError);
              return;
            }

            if (newProfile) {
              setUserProfile({
                ...(newProfile as Database["public"]["Tables"]["users"]["Row"]),
                ratings: {
                  politeness: { average: 0, count: 0 },
                  relevance: { average: 0, count: 0 },
                  problemSolved: { average: 0, count: 0 },
                  communication: { average: 0, count: 0 },
                  professionalism: { average: 0, count: 0 },
                },
              } as UserProfile);
              return;
            }
          } catch (createError) {
            console.error("Error creating user profile:", createError);
          }
        }
        return;
      }

      if (profile) {
        // Fetch ratings for the user
        const { data: ratings } = await supabase
          .from("ratings")
          .select(
            "politeness, relevance, problem_solved, communication, professionalism"
          )
          .eq("user_id", user.uid);

        interface RatingData {
          politeness: number;
          relevance: number;
          problem_solved: number;
          communication: number;
          professionalism: number;
        }

        const ratingsData = ratings?.reduce(
          (acc, rating: RatingData) => {
            acc.politeness.sum += rating.politeness;
            acc.relevance.sum += rating.relevance;
            acc.problemSolved.sum += rating.problem_solved;
            acc.communication.sum += rating.communication;
            acc.professionalism.sum += rating.professionalism;
            acc.count++;
            return acc;
          },
          {
            politeness: { sum: 0, count: 0 },
            relevance: { sum: 0, count: 0 },
            problemSolved: { sum: 0, count: 0 },
            communication: { sum: 0, count: 0 },
            professionalism: { sum: 0, count: 0 },
            count: 0,
          }
        ) || {
          politeness: { sum: 0, count: 0 },
          relevance: { sum: 0, count: 0 },
          problemSolved: { sum: 0, count: 0 },
          communication: { sum: 0, count: 0 },
          professionalism: { sum: 0, count: 0 },
          count: 0,
        };

        const formattedRatings = {
          politeness: {
            average:
              ratingsData.count > 0
                ? ratingsData.politeness.sum / ratingsData.count
                : 0,
            count: ratingsData.count,
          },
          relevance: {
            average:
              ratingsData.count > 0
                ? ratingsData.relevance.sum / ratingsData.count
                : 0,
            count: ratingsData.count,
          },
          problemSolved: {
            average:
              ratingsData.count > 0
                ? ratingsData.problemSolved.sum / ratingsData.count
                : 0,
            count: ratingsData.count,
          },
          communication: {
            average:
              ratingsData.count > 0
                ? ratingsData.communication.sum / ratingsData.count
                : 0,
            count: ratingsData.count,
          },
          professionalism: {
            average:
              ratingsData.count > 0
                ? ratingsData.professionalism.sum / ratingsData.count
                : 0,
            count: ratingsData.count,
          },
        };

        setUserProfile({
          ...(profile as Database["public"]["Tables"]["users"]["Row"]),
          ratings: formattedRatings,
        } as UserProfile);
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  }, [user]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          const supabaseUser = session.user;
          const user: User = {
            uid: supabaseUser.id,
            email: supabaseUser.email || null,
            displayName:
              supabaseUser.user_metadata?.display_name ||
              supabaseUser.email ||
              null,
            emailVerified: supabaseUser.email_confirmed_at !== null,
          };
          setUser(user);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch {
        // Silent error handling for security
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const supabaseUser = session.user;
        const user: User = {
          uid: supabaseUser.id,
          email: supabaseUser.email || null,
          displayName:
            supabaseUser.user_metadata?.display_name ||
            supabaseUser.email ||
            null,
          emailVerified: supabaseUser.email_confirmed_at !== null,
        };
        setUser(user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !userProfile) {
      // Only refresh if we don't have a profile yet
      const timer = setTimeout(() => {
        refreshUserProfile();
      }, 100);
      return () => clearTimeout(timer);
    } else if (!user) {
      setUserProfile(null);
    }
  }, [refreshUserProfile, user, userProfile]); // Only depend on user and profile

  const logIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide more specific error messages
        if (error.message.includes("Invalid login credentials")) {
          throw new Error(
            "Invalid email or password. Please check your credentials and try again."
          );
        } else if (error.message.includes("Email not confirmed")) {
          throw new Error(
            "Please check your email and click the verification link before logging in."
          );
        } else if (error.message.includes("Too many requests")) {
          throw new Error(
            "Too many login attempts. Please wait a moment and try again."
          );
        } else if (
          error.message.includes("fetch") ||
          error.message.includes("Failed to fetch")
        ) {
          throw new Error(
            "Network error. Please check your internet connection and try again."
          );
        } else if (error.message.includes("CORS")) {
          throw new Error(
            "Configuration error. Please try again in a few minutes."
          );
        } else {
          throw new Error(`Login failed: ${error.message}`);
        }
      }

      // Check if email is verified
      if (data.user && !data.user.email_confirmed_at) {
        throw new Error(
          "Please check your email and click the verification link before logging in."
        );
      }

      // Don't redirect here - let the calling component handle navigation
      // The auth state change will be picked up by useEffect in components
    } catch (networkError) {
      if (
        networkError instanceof Error &&
        networkError.message &&
        !networkError.message.includes("Login failed:")
      ) {
        // This is already a formatted error from above
        throw networkError;
      } else {
        // This is a network or unexpected error
        throw new Error(
          "Unable to connect to authentication service. Please check your internet connection and try again."
        );
      }
    }
  };

  const logOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    router.push("/login");
  };

  const signUp = async (data: SignUpData) => {
    const displayName = `${data.firstName} ${data.lastName}`.trim();

    const { data: signupData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${
          process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        }/auth/callback?next=/auth/verified`,
        data: {
          display_name: displayName,
          first_name: data.firstName,
          last_name: data.lastName,
        },
      },
    });

    if (error) {
      // Provide more specific error messages
      if (error.message.includes("User already registered")) {
        throw new Error(
          "An account with this email already exists. Please try logging in instead."
        );
      } else if (error.message.includes("Password should be at least")) {
        throw new Error("Password must be at least 6 characters long.");
      } else {
        throw new Error(error.message);
      }
    }

    // Verify that signup was successful
    if (!signupData.user) {
      throw new Error("Failed to create account. Please try again.");
    }

    // The database trigger should create the user profile automatically
    // But we can add a small delay to ensure it's created
    setTimeout(async () => {
      try {
        // Verify user profile was created
        if (signupData.user) {
          const { error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("id", signupData.user.id)
            .single();

          if (profileError) {
            console.warn("User profile not found after signup:", profileError);

            // If it's a permission error, try to create the profile manually
            if (profileError.code === "42501") {
              console.log(
                "Attempting to create user profile manually due to RLS permission error..."
              );
              try {
                await createUserProfile(
                  signupData.user.id,
                  signupData.user.email || "",
                  signupData.user.user_metadata?.display_name ||
                    signupData.user.email ||
                    null
                );
                console.log("User profile created successfully");
              } catch (createError) {
                console.error(
                  "Failed to create user profile manually:",
                  createError
                );
              }
            }
          }
        }
      } catch (error) {
        console.warn("Error verifying user profile creation:", error);
      }
    }, 2000); // Increased delay to give more time for the trigger
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      }/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: `${
          process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        }/auth/callback?next=/auth/verified`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const createUserProfile = async (
    userId: string,
    email: string,
    displayName: string | null
  ) => {
    try {
      // First check if profile already exists
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

      if (existingProfile) {
        console.log("User profile already exists");
        return existingProfile;
      }

      const insertResult = await (
        supabase as unknown as {
          from: (table: string) => {
            insert: (data: Record<string, unknown>) => {
              select: () => {
                single: () => Promise<{
                  data: Database["public"]["Tables"]["users"]["Row"] | null;
                  error: { code?: string; message?: string } | null;
                }>;
              };
            };
          };
        }
      )
        .from("users")
        .insert({
          id: userId,
          email: email,
          display_name: displayName,
          first_name: displayName?.split(" ")[0] || null,
          last_name: displayName?.split(" ").slice(1).join(" ") || null,
        })
        .select()
        .single();

      const { data: profile, error } = insertResult;
      console.log("Profile created:", profile);

      if (error) {
        console.error("Error creating user profile:", error);

        // Handle specific error cases
        if (error.code === "23505") {
          // Unique constraint violation
          console.log("Profile already exists (unique constraint)");
          // Try to fetch the existing profile
          const { data: existingProfile } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();
          return existingProfile;
        }

        throw new Error(`Failed to create user profile: ${error.message}`);
      }

      return profile;
    } catch (error) {
      console.error("Error in createUserProfile:", error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    logIn,
    logOut,
    signUp,
    sendPasswordReset,
    resendVerificationEmail,
    createUserProfile,
    refreshUserProfile,
    isInOngoingSession,
    setIsInOngoingSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
