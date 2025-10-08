
'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/common/logo';
import { useRouter } from 'next/navigation';

import { User, Cake, Mail, Lock } from 'lucide-react';
import { differenceInYears } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';


const signupSchema = z
  .object({
    firstName: z.string().min(1, { message: 'First name is required.' }),
    lastName: z.string().min(1, { message: 'Last name is required.' }),
    email: z.string().email({ message: 'Please enter a valid email.' }),
    password: z.string()
      .min(12, { message: 'Password must be at least 12 characters.' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        { message: 'Password must contain uppercase, lowercase, number, and special character.' }),
    confirmPassword: z.string(),
    dobMonth: z.string().min(1, { message: 'Month is required.' }),
    dobDay: z.string().min(1, { message: 'Day is required.' }),
    dobYear: z.string().min(1, { message: 'Year is required.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => {
    // Validate date components and age
    const month = parseInt(data.dobMonth);
    const day = parseInt(data.dobDay);
    const year = parseInt(data.dobYear);
    
    // Check if it's a valid date
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return false;
    }
    
    // Check age requirements
    const age = differenceInYears(new Date(), date);
    return age >= 13 && age <= 120;
  }, {
    message: "You must be at least 13 years old and enter a valid date.",
    path: ['dobDay'],
  });

type SignupInput = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { signUp } = useAuth();

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      dobMonth: '',
      dobDay: '',
      dobYear: '',
    },
    mode: 'onChange', // Add this to trigger validation on change
  });

  const dobMonth = form.watch('dobMonth');
  const dobDay = form.watch('dobDay');
  const dobYear = form.watch('dobYear');
  
  const age = dobMonth && dobDay && dobYear ? 
    differenceInYears(new Date(), new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay))) : null;

  // Remove debug logging for security

  // Generate arrays for dropdowns
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const days = Array.from({ length: 31 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString(),
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }));

  const onSubmit = async (data: SignupInput) => {
    try {
      // Convert date components to a Date object
      const dob = new Date(parseInt(data.dobYear), parseInt(data.dobMonth) - 1, parseInt(data.dobDay));
      
      const signupData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        dob: dob,
      };
      
      await signUp(signupData);
      
      toast({
        title: 'Account Created Successfully!',
        description: 'Please check your email and click the verification link to activate your account. You will then be able to log in.',
      });

      router.push('/login');

    } catch (error: any) {
      toast({
        title: 'Sign-up Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center border-b bg-white/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo />
        </Link>
        <nav className="ml-auto">
          <Button variant="ghost" asChild className="text-sm px-2 sm:px-4">
            <Link href="/login">Log In</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12">
        <Card className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Create an Account</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Join Harthio to start connecting with others. A verification link will be sent to your email.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm sm:text-base">
                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                            First Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Jane" {...field} className="h-10 sm:h-11 text-sm sm:text-base" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm sm:text-base">
                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                            Last Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} className="h-10 sm:h-11 text-sm sm:text-base" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm sm:text-base">
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane.doe@example.com" {...field} className="h-10 sm:h-11 text-sm sm:text-base" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <FormLabel className="flex items-center gap-2 text-sm sm:text-base">
                    <Cake className="h-3 w-3 sm:h-4 sm:w-4" />
                    Date of birth
                    {age && (
                      <span className="text-xs sm:text-sm text-muted-foreground font-normal">
                        ({age} years old)
                      </span>
                    )}
                  </FormLabel>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <FormField
                      control={form.control}
                      name="dobMonth"
                      render={({ field }) => (
                        <FormItem>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                                <SelectValue placeholder="Month" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month.value} value={month.value}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dobDay"
                      render={({ field }) => (
                        <FormItem>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                                <SelectValue placeholder="Day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {days.map((day) => (
                                <SelectItem key={day.value} value={day.value}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dobYear"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year.value} value={year.value}>
                                  {year.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {(form.formState.errors.dobMonth || form.formState.errors.dobDay || form.formState.errors.dobYear) && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.dobMonth?.message || 
                       form.formState.errors.dobDay?.message || 
                       form.formState.errors.dobYear?.message}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    You must be at least 13 years old to create an account
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm sm:text-base">
                        <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} className="h-10 sm:h-11 text-sm sm:text-base" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm sm:text-base">
                        <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} className="h-10 sm:h-11 text-sm sm:text-base" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-sm sm:text-base py-2 sm:py-3" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
            <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Log In
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
