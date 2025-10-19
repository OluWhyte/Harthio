// Global type declarations for Harthio

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'exception',
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

// Extend Supabase User type to include user_metadata
declare module '@supabase/supabase-js' {
  interface User {
    user_metadata?: {
      display_name?: string;
      [key: string]: any;
    };
  }
}

export {};