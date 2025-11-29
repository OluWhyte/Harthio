'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Loader2, Upload, X, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const countries = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", 
  "Spain", "Italy", "Netherlands", "Sweden", "Norway", "Denmark", "Switzerland",
  "Austria", "Belgium", "Portugal", "Ireland", "New Zealand", "Japan", "South Korea",
  "China", "India", "Brazil", "Mexico", "Argentina", "Nigeria", "South Africa",
  "Kenya", "Ghana", "Egypt", "Other"
].sort();

const getInitials = (name: string = '') => {
  if (!name) return 'U';
  return name.split(' ').map((n) => n[0] || '').join('').toUpperCase().slice(0, 2);
};

interface ProfileFormData {
  headline: string;
  country: string;
  recovery_goals: string;
}

export default function EditProfilePage() {
  const { user, userProfile, loading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { isSubmitting, errors }, setValue, reset } = useForm<ProfileFormData>({
    defaultValues: {
      headline: '',
      country: '',
      recovery_goals: '',
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (userProfile) {
      reset({
        headline: userProfile.headline || '',
        country: userProfile.country || '',
        recovery_goals: userProfile.recovery_goals || '',
      });
      setPreviewUrl(userProfile.avatar_url || null);
    }
  }, [user, userProfile, loading, router, reset]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, or WebP image',
      });
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB',
      });
      return;
    }

    // Upload immediately
    setIsUploading(true);
    try {
      const { userService } = await import('@/lib/supabase-services');
      await userService.uploadProfilePicture(user.uid, file);
      
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      
      await refreshUserProfile();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: 'Success',
        description: 'Profile picture updated!',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload image',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePicture = async () => {
    if (!user) return;

    setIsUploading(true);
    try {
      const { userService } = await import('@/lib/supabase-services');
      await userService.deleteProfilePicture(user.uid);
      
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setImageFile(null);
      
      await refreshUserProfile();
      
      toast({
        title: 'Success',
        description: 'Profile picture removed',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to remove picture',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!userProfile?.id) return;

    try {
      const { userService } = await import('@/lib/supabase-services');
      
      await userService.updateUserProfile(userProfile.id, {
        headline: data.headline || null,
        country: data.country || null,
        recovery_goals: data.recovery_goals || null,
      });
      
      await refreshUserProfile();
      
      toast({
        title: 'Success',
        description: 'Profile updated!',
      });
      
      router.push('/me');
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.message || 'Failed to update profile',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !userProfile) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/me" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Edit Profile</h1>
          </div>
          <Button 
            type="submit" 
            form="profile-form"
            disabled={isSubmitting}
            size="sm"
            className="rounded-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto pb-20 md:pb-6">
        <form id="profile-form" onSubmit={handleSubmit(onSubmit)}>
          {/* Profile Picture */}
          <div className="bg-background border-b px-4 md:px-6 py-6">
            <h2 className="text-[17px] font-semibold mb-4">Profile Picture</h2>
            <div className="flex items-start gap-4">
              <Avatar className="h-24 w-24 md:h-28 md:w-28 bg-background border border-border flex-shrink-0">
                <AvatarImage src={previewUrl || undefined} alt="Profile" />
                <AvatarFallback className="bg-background">
                  <User className="h-12 w-12 md:h-14 md:w-14 text-accent" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  disabled={isUploading}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                  {userProfile.avatar_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeletePicture}
                      disabled={isUploading}
                      className="text-destructive rounded-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, or WebP, max 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-background border-b px-4 md:px-6 py-6 space-y-5">
            <h2 className="text-[17px] font-semibold">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[15px]">First Name</Label>
                <Input value={userProfile.first_name || ''} disabled />
                <p className="text-xs text-muted-foreground">Cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[15px]">Last Name</Label>
                <Input value={userProfile.last_name || ''} disabled />
                <p className="text-xs text-muted-foreground">Cannot be changed</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline" className="text-[15px]">Headline</Label>
              <Textarea
                id="headline"
                placeholder="A short bio about yourself..."
                rows={3}
                {...register('headline', { 
                  maxLength: { value: 200, message: 'Headline must be 200 characters or less' }
                })}
                className={errors.headline ? 'border-destructive' : ''}
              />
              {errors.headline && (
                <p className="text-xs text-destructive">{errors.headline.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Max 200 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-[15px]">Country</Label>
              <Select
                value={userProfile.country || ''}
                onValueChange={(value) => setValue('country', value)}
              >
                <SelectTrigger className="h-11">
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

          {/* Recovery Information */}
          <div className="bg-background px-4 md:px-6 py-6 space-y-5">
            <h2 className="text-[17px] font-semibold">Recovery Journey</h2>
            
            <div className="space-y-2">
              <Label htmlFor="recovery_goals" className="text-[15px]">Recovery Goals</Label>
              <Textarea
                id="recovery_goals"
                placeholder="What are you working towards in your recovery? (Optional)"
                rows={4}
                {...register('recovery_goals', { 
                  maxLength: { value: 500, message: 'Recovery goals must be 500 characters or less' }
                })}
                className={errors.recovery_goals ? 'border-destructive' : ''}
              />
              {errors.recovery_goals && (
                <p className="text-xs text-destructive">{errors.recovery_goals.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Share your recovery goals to help others understand your journey. Max 500 characters.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
