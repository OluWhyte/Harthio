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
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase";

// User object structure compatible with existing code
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
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
  signUp: (data: any) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  createUserProfile: (
    userId: string,
    email: string,
    displayName: string | null
  ) => Promise<any>;
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
            const { data: newProfile, error: createError } = await supabase
              .from("users")
              .insert({
                id: user.uid,
                email: user.email,
                display_name: user.displayName,
                first_name: user.displayName?.split(" ")[0] || null,
                last_name:
                  user.displayName?.split(" ").slice(1).join(" ") || null,
              } as any)
              .select()
              .single();

            if (createError) {
              console.error("Error creating user profile:", createError);
              return;
            }

            if (newProfile) {
              setUserProfile({
                ...(newProfile as any),
                ratings: {
                  politeness: { average: 0, count: 0 },
                  relevance: { average: 0, count: 0 },
                  problemSolved: { average: 0, count: 0 },
                  communication: { average: 0, count: 0 },
                  professionalism: { average: 0, count: 0 },
                },
              });
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

        const ratingsData = ratings?.reduce(
          (acc, rating: any) => {
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
          ...(profile as any),
          ratings: formattedRatings,
        });
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  }, [user]);

  useEffect(() => {
    // Get initial session with better error handling
    const getInitialSession = async () => {
      try {
        console.log("Getting initial session...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting initial session:", error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log("Initial session found for user:", session.user.id);
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
          console.log("No initial session found");
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with better logging
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.id || "no user");

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
  }, [user?.uid, userProfile?.id]); // Only depend on user ID and profile ID

  const logIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);

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
      } else {
        throw new Error("Login failed. Please try again.");
      }
    }

    // Check if email is verified
    if (data.user && !data.user.email_confirmed_at) {
      throw new Error(
        "Please check your email and click the verification link before logging in."
      );
    }

    router.push("/dashboard");
  };

  const logOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    router.push("/login");
  };

  const signUp = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dob: Date;
  }) => {
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
          const { data: profile, error: profileError } = await supabase
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

      const { data: profile, error } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: email,
          display_name: displayName,
          first_name: displayName?.split(" ")[0] || null,
          last_name: displayName?.split(" ").slice(1).join(" ") || null,
        } as any)
        .select()
        .single();

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
