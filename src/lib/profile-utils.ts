/**
 * Profile Management Utilities for Harthio
 * Provides helper functions for profile operations, validation, and formatting
 */

import type { User } from "./database-types";

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export interface ProfileValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

/**
 * Validate profile form data
 */
export function validateProfileData(
  data: ProfileFormData
): ProfileValidationResult {
  const errors: string[] = [];

  // First name validation (required)
  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push("First name is required");
  } else if (data.firstName.trim().length < 2) {
    errors.push("First name must be at least 2 characters");
  } else if (data.firstName.length > 30) {
    errors.push("First name must be less than 30 characters");
  }

  // Last name validation (required)
  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push("Last name is required");
  } else if (data.lastName.trim().length < 2) {
    errors.push("Last name must be at least 2 characters");
  } else if (data.lastName.length > 30) {
    errors.push("Last name must be less than 30 characters");
  }

  // Phone number validation (optional)
  if (data.phoneNumber && data.phoneNumber.trim().length > 0) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(data.phoneNumber.replace(/[\s\-\(\)]/g, ""))) {
      errors.push("Please enter a valid phone number");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate image file for profile picture upload
 */
export function validateImageFile(file: File): ProfileValidationResult {
  const errors: string[] = [];

  // File type validation
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    errors.push("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
  }

  // File size validation (2MB limit)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    errors.push("File too large. Please upload an image smaller than 2MB.");
  }

  // File name validation
  if (file.name.length > 255) {
    errors.push("File name is too long.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format user display name with fallbacks
 */
export function formatDisplayName(user: User): string {
  if (user.display_name) {
    return user.display_name;
  }

  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  if (fullName) {
    return fullName;
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "Anonymous User";
}

/**
 * Generate initials from display name string
 */
export function generateInitials(displayName: string): string {
  if (!displayName || displayName === "Anonymous User") {
    return "U";
  }

  return displayName
    .split(" ")
    .map((name) => name[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2); // Limit to 2 characters
}

/**
 * Get user initials for avatar fallback
 */
export function getUserInitials(user: User): string {
  const displayName = formatDisplayName(user);
  return generateInitials(displayName);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Format member since date
 */
export function formatMemberSince(createdAt: string): string {
  try {
    const date = new Date(createdAt);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `Member since ${month} ${year}`;
  } catch (error) {
    return "Member since recently";
  }
}

// ============================================================================
// PROFILE COMPLETION UTILITIES
// ============================================================================

export interface ProfileCompletionStatus {
  percentage: number;
  missingFields: string[];
  suggestions: string[];
}

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(
  user: User
): ProfileCompletionStatus {
  const fields = [
    { key: "first_name", name: "First Name", weight: 20 },
    { key: "last_name", name: "Last Name", weight: 20 },
    { key: "avatar_url", name: "Profile Picture", weight: 25 },
    { key: "phone_verified", name: "Phone Verification", weight: 15 },
    { key: "email", name: "Email", weight: 20 }, // Should always be present
  ];

  let completedWeight = 0;
  const missingFields: string[] = [];
  const suggestions: string[] = [];

  fields.forEach((field) => {
    const value = user[field.key as keyof User];
    if (value && value.toString().trim().length > 0) {
      completedWeight += field.weight;
    } else {
      missingFields.push(field.name);

      // Add specific suggestions
      switch (field.key) {
        case "avatar_url":
          suggestions.push(
            "Upload a profile picture to personalize your account"
          );
          break;
        case "first_name":
        case "last_name":
          suggestions.push(
            "Complete your name for a more professional profile"
          );
          break;
        case "phone_verified":
          if (user.phone_number && !user.phone_verified) {
            suggestions.push("Verify your phone number for added security");
          } else if (!user.phone_number) {
            suggestions.push("Add and verify your phone number");
          }
          break;
      }
    }
  });

  return {
    percentage: Math.round(completedWeight),
    missingFields,
    suggestions: suggestions.slice(0, 2), // Limit to top 2 suggestions
  };
}

// ============================================================================
// IMAGE UTILITIES
// ============================================================================

/**
 * Generate unique filename for profile picture
 */
export function generateProfileImageFilename(
  userId: string,
  originalFilename: string
): string {
  const timestamp = Date.now();
  const extension = originalFilename.split(".").pop()?.toLowerCase() || "jpg";
  return `${userId}-${timestamp}.${extension}`;
}

/**
 * Extract filename from avatar URL
 */
export function extractFilenameFromUrl(url: string): string | null {
  try {
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1];
    return filename || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if image URL is valid
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const validUrl = new URL(url);
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    return validExtensions.some((ext) =>
      validUrl.pathname.toLowerCase().includes(ext)
    );
  } catch (error) {
    return false;
  }
}

// ============================================================================
// FORM UTILITIES
// ============================================================================

/**
 * Sanitize profile form data
 */
export function sanitizeProfileData(data: ProfileFormData): ProfileFormData {
  return {
    firstName: data.firstName?.trim() || "",
    lastName: data.lastName?.trim() || "",
    phoneNumber: data.phoneNumber?.trim() || "",
  };
}

/**
 * Check if profile data has changes
 */
export function hasProfileChanges(
  currentData: User,
  formData: ProfileFormData
): boolean {
  const sanitized = sanitizeProfileData(formData);

  return (
    currentData.first_name !== sanitized.firstName ||
    currentData.last_name !== sanitized.lastName ||
    currentData.phone_number !== (sanitized.phoneNumber || null)
  );
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export interface ProfileError {
  type: "validation" | "upload" | "network" | "permission" | "unknown";
  message: string;
  field?: string;
}

/**
 * Parse and categorize profile-related errors
 */
export function parseProfileError(error: any): ProfileError {
  const message = error?.message || "An unknown error occurred";

  // Network errors
  if (message.includes("fetch") || message.includes("network")) {
    return {
      type: "network",
      message: "Network error. Please check your connection and try again.",
    };
  }

  // Permission errors
  if (message.includes("permission") || message.includes("unauthorized")) {
    return {
      type: "permission",
      message: "You do not have permission to perform this action.",
    };
  }

  // Upload errors
  if (message.includes("upload") || message.includes("storage")) {
    return {
      type: "upload",
      message: "Failed to upload image. Please try again.",
    };
  }

  // Validation errors
  if (message.includes("required") || message.includes("invalid")) {
    return {
      type: "validation",
      message,
    };
  }

  return {
    type: "unknown",
    message,
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PROFILE_CONSTANTS = {
  MAX_DISPLAY_NAME_LENGTH: 50,
  MIN_DISPLAY_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 30,
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  ALLOWED_IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a file is a valid image
 */
export function isValidImageFile(file: File): boolean {
  return (
    (PROFILE_CONSTANTS.ALLOWED_IMAGE_TYPES as readonly string[]).includes(
      file.type
    ) && file.size <= PROFILE_CONSTANTS.MAX_FILE_SIZE
  );
}

/**
 * Check if profile data is complete enough for display
 */
export function isProfileDisplayReady(user: User): boolean {
  return !!(user.display_name || user.first_name || user.last_name);
}

/**
 * Check if user has a profile picture
 */
export function hasProfilePicture(user: User): boolean {
  return !!(user.avatar_url && isValidImageUrl(user.avatar_url));
}
