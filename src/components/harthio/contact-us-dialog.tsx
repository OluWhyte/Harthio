
'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useAuth } from '@/hooks/use-auth';

const contactSchema = z.object({
  topic: z.enum(['feedback', 'feature', 'issue'], {
    required_error: 'Please select a topic.',
  }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }).max(500, { message: 'Message must be less than 500 characters.' }),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactUsDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
        message: '',
    }
  });

  const onSubmit = async (data: ContactFormValues) => {
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in to send a message.', variant: 'destructive' });
        return;
    }
    
    try {
        // Send contact form data to API
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userName: userProfile ? 
                    `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 
                    userProfile.display_name || 
                    user.email?.split('@')[0] || 'User'
                    : (user as any).user_metadata?.display_name || user.email?.split('@')[0] || 'User',
                userEmail: user.email,
                topic: data.topic,
                message: data.message,
            }),
        });

        const result = await response.json();

        if (result.success) {
            toast({
                title: 'Message Sent! ✅',
                description: result.message || "Thanks for your feedback. We'll get back to you soon.",
            });
            
            form.reset();
            setOpen(false);
        } else {
            throw new Error(result.error || 'Failed to send message');
        }
    } catch (error) {
        console.error("Error submitting contact form:", error);
        toast({ 
            title: 'Error', 
            description: error instanceof Error ? error.message : 'There was a problem sending your message. Please try again.', 
            variant: 'destructive' 
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
          <DialogDescription>
            Have feedback, a feature suggestion, or an issue to report? Let us know.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a topic" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="feedback">Send Feedback</SelectItem>
                            <SelectItem value="feature">Suggest a Feature</SelectItem>
                            <SelectItem value="issue">Report an Issue</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Tell us what's on your mind..."
                                className="resize-none"
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
