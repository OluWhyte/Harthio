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
  const [imageFile, setImageFile] = useState<File | null>(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    if (!user || !imageFile) return;

    setIsUploading(true);
    try {
      const { userService } = await import('@/lib/supabase-services');
      await userService.uploadProfilePicture(user.uid, imageFile);
      
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      
      await refreshUserProfile();
      setImageFile(null);
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
      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32 ring-4 ring-primary/10 shadow-lg">
                  <AvatarImage src={previewUrl || undefined} alt="Profile" />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials(userProfile.display_name || '')}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2 w-full max-w-sm">
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    disabled={isUploading}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={isUploading || !imageFile}
                      size="sm"
                      className="flex-1"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </>
                      )}
                    </Button>
                    {(userProfile.avatar_url || previewUrl) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDeletePicture}
                        disabled={isUploading}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    JPEG, PNG, or WebP, max 2MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={userProfile.first_name || ''} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={userProfile.last_name || ''} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Cannot be changed</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
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
                <Label htmlFor="country">Country</Label>
                <Select
                  value={userProfile.country || ''}
                  onValueChange={(value) => setValue('country', value)}
                >
                  <SelectTrigger>
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
            </CardContent>
          </Card>

          {/* Recovery Information */}
          <Card>
            <CardHeader>
              <CardTitle>Recovery Journey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recovery_goals">Recovery Goals</Label>
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
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-3">
            <Link href="/me" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
