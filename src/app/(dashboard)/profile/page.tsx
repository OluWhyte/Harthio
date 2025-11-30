"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Loader2, Upload, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RatingBar } from "@/components/harthio/rating-bar";
import { realtimeManager } from "@/lib/realtime-manager";
import { format } from "date-fns";
import { 
  validateProfileData, 
  validateImageFile, 
  formatMemberSince, 
  getUserInitials,
  formatFileSize,
  calculateProfileCompletion,
  sanitizeProfileData,
  hasProfileChanges
} from "@/lib/profile-utils";

const interestsList = [
  "Technology",
  "Art & Culture",
  "Health & Wellness",
  "Parenting",
  "Finance",
  "Career Growth",
  "Travel",
  "Gaming",
  "Relationships",
  "Mindfulness",
  "Startups",
  "Book Club",
];

const countryCodes = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+31", country: "NL", flag: "🇳🇱" },
  { code: "+46", country: "SE", flag: "🇸🇪" },
  { code: "+47", country: "NO", flag: "🇳🇴" },
  { code: "+45", country: "DK", flag: "🇩🇰" },
  { code: "+41", country: "CH", flag: "🇨🇭" },
  { code: "+43", country: "AT", flag: "🇦🇹" },
  { code: "+32", country: "BE", flag: "🇧🇪" },
  { code: "+351", country: "PT", flag: "🇵🇹" },
  { code: "+353", country: "IE", flag: "🇮🇪" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+64", country: "NZ", flag: "🇳🇿" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+52", country: "MX", flag: "🇲🇽" },
  { code: "+54", country: "AR", flag: "🇦🇷" },
  // African Countries
  { code: "+234", country: "NG", flag: "🇳🇬" },
  { code: "+27", country: "ZA", flag: "🇿🇦" },
  { code: "+20", country: "EG", flag: "🇪🇬" },
  { code: "+254", country: "KE", flag: "🇰🇪" },
  { code: "+233", country: "GH", flag: "🇬🇭" },
  { code: "+256", country: "UG", flag: "🇺🇬" },
  { code: "+255", country: "TZ", flag: "🇹🇿" },
  { code: "+251", country: "ET", flag: "🇪🇹" },
  { code: "+212", country: "MA", flag: "🇲🇦" },
  { code: "+216", country: "TN", flag: "🇹🇳" },
  { code: "+213", country: "DZ", flag: "🇩🇿" },
  { code: "+218", country: "LY", flag: "🇱🇾" },
  { code: "+221", country: "SN", flag: "🇸🇳" },
  { code: "+225", country: "CI", flag: "🇨🇮" },
  { code: "+226", country: "BF", flag: "🇧🇫" },
  { code: "+227", country: "NE", flag: "🇳🇪" },
  { code: "+228", country: "TG", flag: "🇹🇬" },
  { code: "+229", country: "BJ", flag: "🇧🇯" },
  { code: "+230", country: "MU", flag: "🇲🇺" },
  { code: "+231", country: "LR", flag: "🇱🇷" },
  { code: "+232", country: "SL", flag: "🇸🇱" },
  { code: "+235", country: "TD", flag: "🇹🇩" },
  { code: "+236", country: "CF", flag: "🇨🇫" },
  { code: "+237", country: "CM", flag: "🇨🇲" },
  { code: "+238", country: "CV", flag: "🇨🇻" },
  { code: "+239", country: "ST", flag: "🇸🇹" },
  { code: "+240", country: "GQ", flag: "🇬🇶" },
  { code: "+241", country: "GA", flag: "🇬🇦" },
  { code: "+242", country: "CG", flag: "🇨🇬" },
  { code: "+243", country: "CD", flag: "🇨🇩" },
  { code: "+244", country: "AO", flag: "🇦🇴" },
  { code: "+245", country: "GW", flag: "🇬🇼" },
  { code: "+246", country: "IO", flag: "🇮🇴" },
  { code: "+248", country: "SC", flag: "🇸🇨" },
  { code: "+249", country: "SD", flag: "🇸🇩" },
  { code: "+250", country: "RW", flag: "🇷🇼" },
  { code: "+252", country: "SO", flag: "🇸🇴" },
  { code: "+253", country: "DJ", flag: "🇩🇯" },
  { code: "+257", country: "BI", flag: "🇧🇮" },
  { code: "+258", country: "MZ", flag: "🇲🇿" },
  { code: "+260", country: "ZM", flag: "🇿🇲" },
  { code: "+261", country: "MG", flag: "🇲🇬" },
  { code: "+262", country: "RE", flag: "🇷🇪" },
  { code: "+263", country: "ZW", flag: "🇿🇼" },
  { code: "+264", country: "NA", flag: "🇳🇦" },
  { code: "+265", country: "MW", flag: "🇲🇼" },
  { code: "+266", country: "LS", flag: "🇱🇸" },
  { code: "+267", country: "BW", flag: "🇧🇼" },
  { code: "+268", country: "SZ", flag: "🇸🇿" },
  { code: "+269", country: "KM", flag: "🇰🇲" },
];

const countries = [
  "Algeria", "Angola", "Argentina", "Australia", "Austria", "Belgium", "Benin", "Botswana", 
  "Brazil", "Burkina Faso", "Burundi", "Cameroon", "Canada", "Cape Verde", "Central African Republic", 
  "Chad", "China", "Comoros", "Democratic Republic of the Congo", "Denmark", "Djibouti", 
  "Egypt", "Equatorial Guinea", "Eswatini", "Ethiopia", "France", "Gabon", "Germany", 
  "Ghana", "Guinea-Bissau", "India", "Ireland", "Italy", "Ivory Coast", "Japan", 
  "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mexico", "Morocco", 
  "Mozambique", "Mauritius", "Namibia", "Netherlands", "New Zealand", "Niger", "Nigeria", 
  "Norway", "Portugal", "Republic of the Congo", "Rwanda", "São Tomé and Príncipe", 
  "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Korea", 
  "Spain", "Sudan", "Sweden", "Switzerland", "Tanzania", "Togo", "Tunisia", "Uganda", 
  "United Kingdom", "United States", "Zambia", "Zimbabwe", "Other"
].sort();

interface ProfileFormData {
  firstName: string;
  lastName: string;
  headline: string;
  phoneNumber: string;
  phoneCountryCode: string;
  country: string;
}

const getInitials = (name: string = "") => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .toUpperCase();
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { userProfile, loading, refreshUserProfile, user } = useAuth();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phone verification states
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const methods = useForm<ProfileFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      headline: "",
      phoneNumber: "",
      phoneCountryCode: "+1",
      country: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    reset,
    watch,
  } = methods;

  useEffect(() => {
    if (userProfile) {
      const initialData = {
        firstName: userProfile.first_name || "", // Auto-filled from profile, not editable
        lastName: userProfile.last_name || "", // Auto-filled from profile, not editable
        headline: userProfile.headline || "",
        phoneNumber: userProfile.phone_number || "",
        phoneCountryCode: userProfile.phone_country_code || "+1",
        country: userProfile.country || "",
      };
      reset(initialData);
      setPreviewUrl(userProfile.avatar_url || null);
      setSelectedInterests([]); // interests field removed from schema
    }
  }, [userProfile, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file using utility function
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast({
          variant: "destructive",
          title: "Invalid file",
          description: validation.errors[0],
        });
        // Reset the input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Clean up previous preview URL if it was a blob
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async () => {
    if (!user || !imageFile) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "Please select a file to upload",
      });
      return;
    }

    setIsUploading(true);
    let originalPreviewUrl = previewUrl; // Store original for rollback
    
    try {
      // Import userService dynamically to avoid circular imports
      const { userService } = await import('@/lib/supabase-services');
      
      // Validate file before upload
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(imageFile.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      }

      // Validate file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (imageFile.size > maxSize) {
        throw new Error('File too large. Please upload an image smaller than 2MB.');
      }
      
      // Upload the image and get the public URL
      const avatarUrl = await userService.uploadProfilePicture(user.uid, imageFile);
      
      // Clean up old blob URL if it exists
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // Update the preview URL to the new uploaded image
      setPreviewUrl(avatarUrl);
      
      // Refresh user profile to get updated data
      await refreshUserProfile();
      
      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      });
      
      // Clear the file after successful upload and clean up blob URL
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Error updating profile picture:", error);
      
      // Reset preview URL on error to original state
      setPreviewUrl(originalPreviewUrl);
      
      let errorMessage = "Failed to update profile picture";
      if (error.message) {
        if (error.message.includes("Bucket not found")) {
          errorMessage = "Storage not configured. Please contact support.";
        } else if (error.message.includes("Invalid file type")) {
          errorMessage = "Please upload a JPEG, PNG, or WebP image";
        } else if (error.message.includes("File too large")) {
          errorMessage = "File too large. Please upload an image smaller than 2MB";
        } else if (error.message.includes("Upload failed")) {
          errorMessage = "Upload failed. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!user) return;

    setIsUploading(true);
    try {
      // Import userService dynamically to avoid circular imports
      const { userService } = await import('@/lib/supabase-services');
      
      // Delete the profile picture
      await userService.deleteProfilePicture(user.uid);
      
      // Clear the preview URL and file, clean up blob URL if needed
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Refresh user profile to get updated data
      await refreshUserProfile();
      
      toast({
        title: "Success",
        description: "Profile picture removed successfully!",
      });
    } catch (error: any) {
      console.error("Error deleting profile picture:", error);
      toast({
        title: "Delete Error",
        description: error.message || "Failed to remove profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleChangePicture = () => {
    // Reset any existing file selection
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Clear any pending image file
    setImageFile(null);
    // Trigger file input
    fileInputRef.current?.click();
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!userProfile?.id) {
      toast({
        title: "Not Authenticated",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      });
      return;
    }

    // Skip validation for first/last name since they're not editable
    // Only validate editable fields
    const errors: string[] = [];
    
    // Validate headline (optional)
    if (data.headline && data.headline.length > 200) {
      errors.push('Headline must be less than 200 characters');
    }
    
    // Validate phone number (optional)
    if (data.phoneNumber && data.phoneNumber.trim().length > 0) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Please enter a valid phone number');
      }
    }
    
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errors[0],
      });
      return;
    }

    // Check if there are actually changes (excluding first/last name)
    const hasChanges = 
      (data.headline || '') !== (userProfile.headline || '') ||
      (data.phoneNumber || '') !== (userProfile.phone_number || '') ||
      (data.phoneCountryCode || '+1') !== (userProfile.phone_country_code || '+1') ||
      (data.country || '') !== (userProfile.country || '');
    
    if (!hasChanges) {
      toast({
        title: "No Changes",
        description: "No changes were made to your profile.",
      });
      setIsEditing(false);
      return;
    }

    try {
      // Import userService dynamically to avoid circular imports
      const { userService } = await import('@/lib/supabase-services');
      
      // Auto-generate display name from existing first/last name
      const displayName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
      
      await userService.updateUserProfile(userProfile.id, {
        display_name: displayName,
        // first_name and last_name are not editable - keep existing values
        headline: (data as any).headline || null,
        phone_number: (data as any).phoneNumber || null,
        phone_country_code: (data as any).phoneCountryCode || "+1",
        country: (data as any).country || null,
      });
      
      // Refresh user profile to get updated data
      await refreshUserProfile();
      
      toast({
        title: "Success!",
        description: "Your profile has been updated.",
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Profile update error:", error);
      
      // Show user-friendly error message
      const errorMessage = error.message || "Failed to update profile. Please try again.";
      
      toast({
        title: "Profile Update Failed",
        description: errorMessage,
        variant: "destructive",
        action: errorMessage.includes('Network connection') ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onSubmit(data)}
          >
            Retry
          </Button>
        ) : undefined,
      });
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Switching from edit to view - preserve current form data
      setIsEditing(false);
    } else {
      // Switching from view to edit - load current profile data
      if (userProfile) {
        const currentData = {
          firstName: userProfile.first_name || "", // Auto-filled from profile, not editable
          lastName: userProfile.last_name || "", // Auto-filled from profile, not editable
          headline: userProfile.headline || "",
          phoneNumber: userProfile.phone_number || "",
          phoneCountryCode: userProfile.phone_country_code || "+1",
          country: userProfile.country || "",
        };
        reset(currentData);
        setPreviewUrl(userProfile.avatar_url || null);
      }
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    if (userProfile) {
      // Only reset when explicitly canceling - preserve current form state otherwise
      const initialData = {
        firstName: userProfile.first_name || "", // Auto-filled from profile, not editable
        lastName: userProfile.last_name || "", // Auto-filled from profile, not editable
        headline: userProfile.headline || "",
        phoneNumber: userProfile.phone_number || "",
        phoneCountryCode: userProfile.phone_country_code || "+1",
        country: userProfile.country || "",
      };
      reset(initialData);
      setPreviewUrl(userProfile.avatar_url || null);
      setSelectedInterests([]);
      setImageFile(null);
      setIsUploading(false);
    }
    setIsEditing(false);
  };

  const getMemberSince = () => {
    if (userProfile?.created_at) {
      const date = new Date(userProfile.created_at);
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear();
      return `Member since ${month} ${year}`;
    }
    return "New Member";
  };

  const handleSendVerificationCode = async () => {
    if (!userProfile?.phone_number) {
      toast({
        variant: "destructive",
        title: "No Phone Number",
        description: "Please add a phone number first.",
      });
      return;
    }

    setIsSendingCode(true);
    try {
      const { userService } = await import('@/lib/supabase-services');
      await userService.sendPhoneVerification(userProfile.phone_number);
      
      setShowPhoneVerification(true);
      toast({
        title: "Code Sent",
        description: "Verification code sent to your phone number.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Send Code",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!userProfile?.phone_number || !verificationCode) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter the verification code.",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { userService } = await import('@/lib/supabase-services');
      await userService.verifyPhoneNumber(
        userProfile.phone_number, 
        verificationCode, 
        userProfile.id
      );
      
      await refreshUserProfile();
      setShowPhoneVerification(false);
      setVerificationCode("");
      
      toast({
        title: "Phone Verified!",
        description: "Your phone number has been successfully verified.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Please check your code and try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return <p>User profile not found. Please try logging in again.</p>;
  }

  const ViewMode = () => (
    <div className="space-y-6">
      {/* Profile Picture Section */}
      <div className="flex flex-col items-center text-center space-y-4">
        <Avatar className="h-32 w-32 ring-4 ring-gray-100 shadow-lg">
        <AvatarImage
          src={userProfile.avatar_url || undefined}
          alt="User avatar"
        />
          <AvatarFallback className="text-2xl">
          {getInitials(userProfile.display_name ?? undefined)}
        </AvatarFallback>
      </Avatar>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {userProfile.display_name || "N/A"}
          </h2>
          {userProfile.headline && (
            <p className="text-lg text-gray-600 italic">
              "{userProfile.headline}"
            </p>
          )}
        </div>
        
        {/* Contact Information */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <span>📧</span>
            <span>{userProfile.email}</span>
          </div>
          
            {/* Phone number temporarily disabled - SMS verification not yet available */}
          
            {userProfile.country && (
            <div className="flex items-center justify-center gap-2">
              <span>📍</span>
              <span>{userProfile.country}</span>
          </div>
          )}
        </div>
        
        {/* Verification Status */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              Email Verified
            </Badge>
            
          {/* Phone verification badge temporarily disabled */}
          </div>
          
        {/* Member Since */}
        <p className="text-sm text-gray-500">{getMemberSince()}</p>
      </div>
    </div>
  );

  const EditMode = () => (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        {/* Profile Picture Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Profile Picture</h3>
            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-gray-100 shadow-lg">
            <AvatarImage
              src={previewUrl ?? undefined}
              alt={userProfile?.display_name ?? undefined}
            />
                <AvatarFallback className="text-lg sm:text-2xl">
              {getInitials(userProfile?.display_name ?? undefined)}
            </AvatarFallback>
          </Avatar>
              
              <div className="space-y-3 w-full max-w-sm sm:max-w-md">
                <p className="text-xs sm:text-sm text-gray-600">
                Upload a profile picture (JPEG, PNG, or WebP, max 2MB)
              </p>
                
                <div className="flex flex-col gap-2">
                <Input
                  id="picture"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="w-full"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={isUploading || !imageFile}
                  size="sm"
                    className="w-full"
                >
                  {isUploading ? (
                    <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                      <>
                        <Upload className="mr-2 h-3 w-3" />
                        Upload
                      </>
                  )}
                </Button>
              </div>
              
              {imageFile && !isUploading && (
                  <p className="text-xs text-gray-500 text-center">
                  Selected: {imageFile.name} ({formatFileSize(imageFile.size)})
                </p>
              )}
            
            {(userProfile?.avatar_url || previewUrl) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteProfilePicture}
                  disabled={isUploading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                >
                    <X className="mr-2 h-3 w-3" />
                  Remove Picture
                </Button>
            )}
            
            {/* Always show change picture option */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleChangePicture}
              disabled={isUploading}
              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Upload className="mr-2 h-3 w-3" />
              {userProfile?.avatar_url || previewUrl ? 'Change Picture' : 'Add Picture'}
            </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Personal Information</h3>
            <div className="grid gap-4 sm:gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm">First Name</Label>
              <Input
                id="firstName"
                    value={userProfile?.first_name || ""}
                    className="text-sm bg-gray-50 cursor-not-allowed"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-gray-500">
                    Name cannot be changed after signup
                  </p>
            </div>
            
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm">Last Name</Label>
              <Input
                id="lastName"
                    value={userProfile?.last_name || ""}
                    className="text-sm bg-gray-50 cursor-not-allowed"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-gray-500">
                    Name cannot be changed after signup
                  </p>
            </div>
          </div>
          
              <div className="space-y-2">
                <Label htmlFor="headline" className="text-sm">Headline</Label>
            <Textarea
              id="headline"
              placeholder="A short bio or tagline about yourself..."
              rows={3}
                  className="text-sm"
              {...register("headline", {
                maxLength: {
                  value: 200,
                  message: "Headline must be less than 200 characters",
                },
              })}
            />
            {methods.formState.errors.headline && (
                  <p className="text-xs text-red-600">
                {methods.formState.errors.headline.message}
              </p>
            )}
              </div>
            </div>
          </div>
          </div>

        {/* Contact Information Section */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact Information</h3>
            <div className="grid gap-4 sm:gap-6">
              {/* Phone number field temporarily disabled - SMS verification not yet available */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Phone Number</Label>
                <div className="p-4 border border-dashed rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground text-center">
                    📱 Phone verification coming soon
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    We're working on adding SMS verification
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm">Country/Nationality</Label>
            <Select
              value={methods.watch("country")}
              onValueChange={(value) => setValue("country", value)}
            >
                  <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold">Verification Status</h3>
          <div className="flex items-center gap-2 sm:gap-4">
            <Badge variant="secondary" className="px-2 py-1 text-xs">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              Email Verified
            </Badge>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
          <Button variant="outline" type="button" onClick={cancelEdit} className="w-full sm:w-auto" size="sm">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto" size="sm">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );

  const InterestsForm = () => (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {interestsList.map((interest) => (
          <div key={interest} className="flex items-center space-x-2">
            <Checkbox
              id={interest}
              checked={selectedInterests.includes(interest)}
              onCheckedChange={(checked) => {
                const newInterests = checked
                  ? [...selectedInterests, interest]
                  : selectedInterests.filter((i) => i !== interest);
                setSelectedInterests(newInterests);
                // Note: interests are managed via state, not form data
              }}
            />
            <Label htmlFor={interest} className="font-normal">
              {interest}
            </Label>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Save Interests"
          )}
        </Button>
      </div>
    </form>
  );

  const ratings = userProfile?.ratings || {
    politeness: { average: 4.5, count: 10 },
    relevance: { average: 4.8, count: 10 },
    problemSolved: { average: 4.2, count: 10 },
    communication: { average: 4.9, count: 10 },
    professionalism: { average: 4.7, count: 10 },
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section - Most Important */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start">
            {/* Profile Picture & Basic Info */}
            <div className="flex flex-col sm:flex-row xl:flex-col items-center xl:items-start gap-4 sm:gap-6 w-full xl:w-auto">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 xl:h-40 xl:w-40 ring-4 ring-white shadow-lg flex-shrink-0">
                <AvatarImage
                  src={userProfile.avatar_url || undefined}
                  alt="User avatar"
                />
                <AvatarFallback className="text-lg sm:text-2xl">
                  {getInitials(userProfile.display_name ?? undefined)}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center sm:text-left xl:text-left space-y-3 flex-1 min-w-0">
                <div>
                  <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold text-gray-900 break-words">
                    {userProfile.display_name || "N/A"}
                  </h1>
                  {userProfile.headline && (
                    <p className="text-sm sm:text-base xl:text-lg text-gray-600 italic mt-1 sm:mt-2 break-words">
                      "{userProfile.headline}"
                    </p>
                  )}
                </div>
                
                {/* Contact Info */}
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600">
                    <span className="text-xs sm:text-sm">📧</span>
                    <span className="text-xs sm:text-sm break-all">{userProfile.email}</span>
                  </div>
                  
                  {userProfile.phone_number && (
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600">
                      <span className="text-xs sm:text-sm">📱</span>
                      <span className="text-xs sm:text-sm">
                        {userProfile.phone_country_code} {userProfile.phone_number}
                      </span>
                      {userProfile.phone_verified && (
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  )}
                  
                  {userProfile.country && (
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600">
                      <span className="text-xs sm:text-sm">📍</span>
                      <span className="text-xs sm:text-sm">{userProfile.country}</span>
                    </div>
                  )}
                </div>
                
                {/* Verification Status */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-2">
                  <Badge variant="secondary" className="px-2 py-1 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    Email Verified
                  </Badge>
                  
                  {userProfile.phone_number && (
                    <Badge 
                      variant={userProfile.phone_verified ? "secondary" : "outline"} 
                      className="px-2 py-1 text-xs"
                    >
                      {userProfile.phone_verified ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          Phone Verified
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1 text-orange-500" />
                          Phone Not Verified
                        </>
                      )}
                    </Badge>
              )}
            </div>
                
                {/* Member Since */}
                <p className="text-xs sm:text-sm text-gray-500">{getMemberSince()}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full xl:w-auto xl:flex-shrink-0">
              <Button 
                onClick={toggleEdit}
                className="w-full sm:w-auto"
                size="sm"
              >
                {isEditing ? "View Profile" : "Edit Profile"}
              </Button>
              
              {userProfile.phone_number && !userProfile.phone_verified && (
                <Button
                  variant="outline"
                  onClick={handleSendVerificationCode}
                  disabled={isSendingCode}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {isSendingCode ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Verify Phone"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid gap-6 sm:gap-8">
          
          {/* Profile Completion & Stats */}
          {userProfile && (() => {
            const completion = calculateProfileCompletion(userProfile as any);
            return (
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                    <h3 className="text-base sm:text-lg font-semibold">Profile Completion</h3>
                    <span className="text-sm text-gray-500">{completion.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-3">
                    <div 
                      className="bg-blue-500 h-2 sm:h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${completion.percentage}%` }}
                    ></div>
                  </div>
                  {completion.suggestions.length > 0 && (
                    <p className="text-xs sm:text-sm text-gray-600">
                      💡 {completion.suggestions[0]}
                    </p>
          )}
        </CardContent>
      </Card>
            );
          })()}

          {/* Edit Mode Content */}
          {isEditing ? (
      <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Edit Profile</CardTitle>
                <CardDescription className="text-sm">
                  Update your personal information and profile picture.
          </CardDescription>
        </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <EditMode />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* User Ratings - High Priority */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <span>⭐</span>
                    User Ratings
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Based on {ratings?.politeness?.count || 0} reviews from past sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                  {ratings ? (
                    <div className="grid gap-3 sm:gap-4">
              <RatingBar
                label="Politeness"
                average={ratings.politeness.average}
                description="1 = Rude, 10 = Respectful"
              />
              <RatingBar
                label="Relevance"
                average={ratings.relevance.average}
                description="1 = Off-topic, 10 = On-topic"
              />
              <RatingBar
                label="Problem-Solved"
                average={ratings.problemSolved.average}
                description="1 = Unhelpful, 10 = Solved my issue"
              />
              <RatingBar
                label="Communication"
                average={ratings.communication.average}
                description="1 = Unclear, 10 = Articulate"
              />
              <RatingBar
                label="Professionalism"
                average={ratings.professionalism.average}
                description="1 = Unprepared, 10 = Expert"
              />
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <div className="text-gray-400 mb-2 text-2xl">⭐</div>
                      <p className="text-gray-500 text-sm sm:text-base">No ratings yet</p>
                      <p className="text-xs sm:text-sm text-gray-400">Complete some sessions to receive ratings</p>
                    </div>
          )}
        </CardContent>
      </Card>

              {/* Interests - Medium Priority */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <span>🎯</span>
                    My Interests
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Topics you're interested in to improve your matches
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.length > 0 ? (
                      selectedInterests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="px-2 py-1 text-xs">
                          {interest}
                        </Badge>
                      ))
                    ) : (
                      <div className="text-center py-4 sm:py-6">
                        <div className="text-gray-400 mb-2 text-2xl">🎯</div>
                        <p className="text-gray-500 text-sm sm:text-base">No interests selected yet</p>
                        <p className="text-xs sm:text-sm text-gray-400">Click 'Edit Profile' to add some</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Phone Verification Dialog - Modal Style */}
      {showPhoneVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm sm:max-w-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg">Verify Phone Number</CardTitle>
              <CardDescription className="text-sm">
              Enter the verification code sent to {userProfile?.phone_number}
            </CardDescription>
          </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="grid gap-2">
                <Label htmlFor="verificationCode" className="text-sm">Verification Code</Label>
              <Input
                id="verificationCode"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                  className="text-center text-base sm:text-lg tracking-widest"
              />
            </div>
            
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPhoneVerification(false);
                  setVerificationCode("");
                }}
                disabled={isVerifying}
                  className="w-full sm:w-auto"
                  size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyPhone}
                disabled={isVerifying || verificationCode.length !== 6}
                  className="w-full sm:w-auto"
                  size="sm"
              >
                {isVerifying ? (
                  <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
            
            <div className="text-center">
              <Button
                variant="link"
                size="sm"
                onClick={handleSendVerificationCode}
                disabled={isSendingCode}
                className="text-xs"
              >
                {isSendingCode ? "Sending..." : "Resend Code"}
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
}
