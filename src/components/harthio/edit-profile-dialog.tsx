
'use client';

import { useState, useRef, ChangeEvent, ReactNode, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Textarea } from '../ui/textarea';
import { useAuth } from '@/hooks/use-auth';

interface EditProfileDialogProps {
    children: ReactNode;
    user: any; // User profile data from useAuth
}

const getInitials = (name: string = '') => {
  const names = name.split(' ');
  const initials = names.map((n) => n[0] || '').join('');
  return initials.toUpperCase() || 'U';
}

export function EditProfileDialog({ children, user }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [headline, setHeadline] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { refreshUserProfile } = useAuth();


  const setInitialState = () => {
    if (user) {
        setPreviewUrl(user.avatarUrl || null);
        setDisplayName(user.displayName || '');
        setTitle(user.title || '');
        setHeadline(user.headline || '');
        setSelectedFile(null);
    }
  };

  useEffect(() => {
    setInitialState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, open]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please select an image smaller than 2MB.',
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    if (!user?.uid) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to update your profile.' });
        return;
    }
    setIsSaving(true);
    
    try {
        // Simulate saving
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await refreshUserProfile();

        toast({
            title: 'Profile Updated',
            description: 'Your profile has been successfully updated.',
        });
        setOpen(false);
    } catch (error) {
        console.error("Error updating profile:", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update your profile. Please try again.' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={previewUrl ?? undefined} alt={displayName} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
              <UserIcon className="mr-2 h-4 w-4" /> Change Picture
            </Button>
            <Input 
                id="picture" 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileChange}
                disabled={isSaving}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input 
                id="displayName" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isSaving}
            />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="title">Title / Role</Label>
            <Input 
                id="title" 
                placeholder="e.g., Software Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="headline">Headline</Label>
            <Textarea
                id="headline"
                placeholder="A short, catchy headline about yourself."
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                disabled={isSaving}
                className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
